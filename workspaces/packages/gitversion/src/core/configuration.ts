import { colorize } from 'colorize-node';
import { existsSync } from 'fs';
import { join } from 'path';
import * as t from 'typanion';

import { IPlugin, PluginManager } from '../plugins/plugin';

import { Git } from './git';
import { logger } from './log-reporter';
import { IProject } from './workspace-utils';

export enum FeatureBumpBehavior {
  AllCommits,
  Never,
  Normal,
}

export const isBaseConfigurationOptions = t.isPartial({
  featureBranchPatterns: t.isOptional(t.isArray(t.isString())),
  releaseBranchPatterns: t.isOptional(t.isArray(t.isString())),
  mainBranch: t.isOptional(t.isString()),
  independentVersioning: t.isOptional(t.isBoolean()),
  versionTagPrefix: t.isOptional(t.isString()),
  featureBumpBehavior: t.isOptional(t.isEnum(FeatureBumpBehavior)),
});


export type BaseConfigurationOptions = t.InferType<typeof isBaseConfigurationOptions>;

export interface PluginConfigurationOptions {
  plugins?: IPlugin[];
}

export type ConfigurationOption = PluginConfigurationOptions & BaseConfigurationOptions;
export type RequiredConfigurationOption = PluginConfigurationOptions & Required<BaseConfigurationOptions>;

const DEFAULT_OPTIONS: RequiredConfigurationOption = {
  featureBranchPatterns: [
    '^feature/(.*)$',
  ],
  releaseBranchPatterns: [
    '^release/(.*)$',
  ],
  mainBranch: 'main',
  independentVersioning: false,
  versionTagPrefix: 'v',
  featureBumpBehavior: FeatureBumpBehavior.Normal,
};

export function defineConfig(config: ConfigurationOption): ConfigurationOption {
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

export interface IBaseConfiguration {
  readonly cwd: string;
  readonly git: Git;
  readonly options: RequiredConfigurationOption;
}

export interface IConfiguration extends IBaseConfiguration {
  readonly pluginManager: PluginManager;
  readonly branch: VersionBranch;
  readonly stagingFolder: string;
}

export class Configuration implements IConfiguration {
  pluginManager: PluginManager;

  cwd: string;
  git: Git;
  options: RequiredConfigurationOption;
  branch: VersionBranch;

  get stagingFolder() {
    return join(this.cwd, 'gitversion.out');
  }

  private constructor(cwd: string, options: RequiredConfigurationOption, branch: VersionBranch, pluginManager: PluginManager) {
    this.cwd = cwd;
    this.options = options;
    this.branch = branch;
    this.git = new Git(cwd);
    this.pluginManager = pluginManager;
  }

  static detectVersionBranch(configOptions: RequiredConfigurationOption, branchName: string): VersionBranch {
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

  static async load(cwd: string): Promise<{ configuration: Configuration, project: IProject, git: Git }> {
    const options: RequiredConfigurationOption = {
      ...DEFAULT_OPTIONS,
      ...(await this.loadCustomConfig(cwd)),
    };

    const git = new Git(cwd);
    const pluginManager = new PluginManager();
    if (options.plugins) {
      for (const plugin of options.plugins) {
        pluginManager.register(plugin);
      }
    }

    await pluginManager.initialize({
      cwd,
      git,
      options,
    });

    // We should have a project type after initialize
    if (!pluginManager.project) {
      throw new Error('Can\'t load project');
    }

    const branchName = await pluginManager.gitPlatform.currentBranch();
    if (!branchName) {
      throw new Error('Can\'t determine current gitbranch. Breaking off');
    }

    const branch = this.detectVersionBranch(options, branchName);

    const configuration = new Configuration(cwd, options, branch, pluginManager);


    return {
      configuration, project: pluginManager.project, git,
    };
  }

  static async loadCustomConfig(cwd: string) {
    if (existsSync(join(cwd, '.gitversion.cjs'))) {
      const config = require(join(cwd, '.gitversion.cjs'));
      if (isBaseConfigurationOptions(config)) {
        return config;
      } else {
        logger.reportError(`Invalid configuration found in ${colorize.magentaBright(join(cwd, './.gitversion.cjs'))}`, true);
        return null;
      }
    }
    return null;
  }
}
