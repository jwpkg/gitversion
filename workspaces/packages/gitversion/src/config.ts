import { colorize } from 'colorize-node';
import { existsSync } from 'fs';
import { join } from 'path';
import * as t from 'typanion';

import { Git } from './utils/git';
import { logger } from './utils/log-reporter';

export const isConfigurationOptions = t.isObject({
  featureBranchPatterns: t.isOptional(t.isArray(t.isString())),
  releaseBranchPatterns: t.isOptional(t.isArray(t.isString())),
  mainBranch: t.isOptional(t.isString()),
  independentVersioning: t.isOptional(t.isBoolean()),
  versionTagPrefix: t.isOptional(t.isString()),
  alwaysBumpFeatureCommits: t.isOptional(t.isBoolean()),
});

export type ConfigurationOptions = t.InferType<typeof isConfigurationOptions>;

export function defineConfig(config: ConfigurationOptions): ConfigurationOptions {
  return config;
}

export enum BranchType {
  MAIN = 'main',
  RELEASE = 'release',
  FEATURE = 'feature',
  UNKNOWN = 'unknown',
}

export interface VersionBranch {
  readonly name: string;
  readonly type: BranchType;
}

export class Configuration {
  private constructor(public options: Required<ConfigurationOptions>, public branch: VersionBranch) { }

  static detectVersionBranch(configOptions: Required<ConfigurationOptions>, branchName: string): VersionBranch {
    if (configOptions.mainBranch === branchName) {
      return {
        type: BranchType.MAIN,
        name: branchName,
      };
    }

    const featureBranchPatterns = configOptions.featureBranchPatterns.map(pattern => new RegExp(pattern));
    for (const branchPattern of featureBranchPatterns) {
      if (branchPattern.test(branchName)) {
        const matches = branchPattern.exec(branchName);

        if (matches && matches.length === 2) {
          return {
            name: matches[1],
            type: BranchType.FEATURE,
          };
        } else {
          throw new Error(`The feature pattern '${branchPattern.source}' matched the current branch but it should result in exact 1 group match`);
        }
      }
    }

    const releaseBranchPatterns = configOptions.releaseBranchPatterns.map(pattern => new RegExp(pattern));
    for (const branchPattern of releaseBranchPatterns) {
      if (branchPattern.test(branchName)) {
        const matches = branchPattern.exec(branchName);

        if (matches && matches.length === 2) {
          return {
            name: matches[1],
            type: BranchType.RELEASE,
          };
        } else {
          throw new Error(`The release pattern '${branchPattern.source}' matched the current branch but it should result in exact 1 group match`);
        }
      }
    }

    return {
      name: 'unknown',
      type: BranchType.UNKNOWN,
    };
  }

  static async load(cwd: string): Promise<Configuration | null> {
    const defaultOptions: Required<ConfigurationOptions> = {
      featureBranchPatterns: [
        '^feature/(.*)$',
      ],
      releaseBranchPatterns: [
        '^release/(.*)$',
      ],
      mainBranch: 'main',
      independentVersioning: false,
      versionTagPrefix: 'v',
      alwaysBumpFeatureCommits: true,
    };
    let options = defaultOptions;

    if (existsSync(join(cwd, '.gitversion.cjs'))) {
      const config = require(join(cwd, '.gitversion.cjs'));
      if (isConfigurationOptions(config)) {
        options = {
          ...options,
          ...config,
        };
      } else {
        logger.reportError(`Invalid configuration found in ${colorize.magentaBright(join(cwd, './.gitversion.cjs'))}`, true);
        return null;
      }
    }

    const git = new Git(cwd);
    const branch = this.detectVersionBranch(options, await git.currentBranch());
    //TODO: load from file
    return new Configuration(options, branch);
  }
}
