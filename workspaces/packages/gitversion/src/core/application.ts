import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { DispatchablePluginHooks, IGitPlatform, IPackManager, PluginManager } from '../plugins';

import { BaseConfigurationOptions, BranchType, Configuration, IConfiguration, RequiredConfigurationOption, VersionBranch, isUpdateableConfiguration } from './configuration';
import { DEFAULT_CONFIGURATION_OPTIONS } from './constants';
import { Executor, IExecutor } from './executor';
import { Git } from './git';
import { LogReporter } from './log-reporter';
import { IProject } from './workspace-utils';

export interface IApplication {
  readonly cwd: string;
  readonly configuration: IConfiguration;
  readonly branch: VersionBranch;
  readonly project: IProject;
  readonly executor: IExecutor;
  readonly git: Git;
  readonly logger: LogReporter;
  readonly gitPlatform: IGitPlatform;
  readonly packManagers: IPackManager[];
  readonly hooks: DispatchablePluginHooks;
  readonly pluginManager: PluginManager;
}

export type CliOptions = Partial<BaseConfigurationOptions>;

export class Application {
  static detectVersionBranch(configOptions: RequiredConfigurationOption, branchName: string): VersionBranch {
    const mainBranchRegex = new RegExp(configOptions.mainBranchPattern);
    if (mainBranchRegex.test(branchName)) {
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


  static async init(application?: IApplication, cliOptions?: CliOptions): Promise<IApplication> {
    if (application) {
      if (cliOptions && isUpdateableConfiguration(application.configuration)) {
        application.configuration.updateOptions(cliOptions);
      }

      return application;
    }

    const logger = new LogReporter();

    const version = JSON.parse(await readFile(resolve(__dirname, '../../package.json'), 'utf-8')).version;
    logger.reportHeader(`Gitversion ${version}`);

    const cwd = await Git.root();

    const executor = new Executor(cwd, logger);

    const options: RequiredConfigurationOption = {
      ...DEFAULT_CONFIGURATION_OPTIONS,
      ...(await Configuration.loadCustomConfig(cwd, logger)),
      ...cliOptions,
    };

    const configuration = new Configuration(cwd, options);

    const git = new Git(cwd, configuration.options.dryRun, logger, executor);
    const pluginManager = new PluginManager();
    if (options.plugins) {
      for (const plugin of options.plugins) {
        pluginManager.register(plugin);
      }
    }

    await pluginManager.initialize({
      cwd,
      git,
      executor,
      options,
      logger,
      packFolder: configuration.packFolder,
      stagingFolder: configuration.stagingFolder,
    });

    // We should have a project type after initialize
    if (!pluginManager.project) {
      throw new Error('Can\'t load project');
    }

    if (pluginManager.packManagers.length == 0) {
      throw new Error('No pack managers found for current project');
    }

    const branchName = await pluginManager.gitPlatform.currentBranch();
    if (!branchName) {
      throw new Error('Can\'t determine current gitbranch. Breaking off');
    }

    const branch = this.detectVersionBranch(options, branchName);


    return {
      cwd,
      configuration,
      pluginManager,
      branch,
      executor,
      logger,
      project: pluginManager.project,
      gitPlatform: pluginManager.gitPlatform,
      hooks: pluginManager,
      packManagers: pluginManager.packManagers,
      git,
    };
  }
}
