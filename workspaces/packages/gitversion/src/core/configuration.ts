import { colorize } from 'colorize-node';
import { existsSync } from 'fs';
import { join } from 'path';
import * as t from 'typanion';

import { LogReporter } from './log-reporter';
import { IPlugin } from './plugin-manager';

export enum FeatureBumpBehavior {
  AllCommits,
  Never,
  Normal,
}

export const isBaseConfigurationOptions = t.isPartial({
  featureBranchPatterns: t.isOptional(t.isArray(t.isString())),
  releaseBranchPatterns: t.isOptional(t.isArray(t.isString())),
  mainBranchPattern: t.isOptional(t.isString()),
  independentVersioning: t.isOptional(t.isBoolean()),
  versionTagPrefix: t.isOptional(t.isString()),
  dryRun: t.isOptional(t.isBoolean()),
  featureBumpBehavior: t.isOptional(t.isEnum(FeatureBumpBehavior)),
});


export type BaseConfigurationOptions = t.InferType<typeof isBaseConfigurationOptions>;

export interface PluginConfigurationOptions {
  plugins?: IPlugin[];
}

export type ConfigurationOption = PluginConfigurationOptions & BaseConfigurationOptions;
export type RequiredConfigurationOption = PluginConfigurationOptions & Required<BaseConfigurationOptions>;

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

export interface IConfiguration {
  readonly cwd: string;
  readonly options: RequiredConfigurationOption;
  readonly stagingFolder: string;
  readonly packFolder: string;
}

export interface IUpdateableConfiguration {
  updateOptions(options: BaseConfigurationOptions): void;
}

export function isUpdateableConfiguration(config: any): config is IUpdateableConfiguration {
  return 'updateOptions' in config && typeof config.updateOptions === 'function';
}

export class Configuration implements IConfiguration, IUpdateableConfiguration {
  cwd: string;
  options: RequiredConfigurationOption;

  get stagingFolder() {
    return join(this.cwd, 'gitversion.out');
  }

  get packFolder() {
    return join(this.stagingFolder, 'pack');
  }

  constructor(cwd: string, options: RequiredConfigurationOption) {
    this.cwd = cwd;
    this.options = options;
  }

  updateOptions(options: BaseConfigurationOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  static async loadCustomConfig(cwd: string, logger: LogReporter) {
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
