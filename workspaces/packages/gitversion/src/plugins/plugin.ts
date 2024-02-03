import { IApplication } from '../core/application';
import { IConfiguration } from '../core/configuration';
import { IExecutor } from '../core/executor';
import { Git, GitCommit } from '../core/git';
import { LogReporter } from '../core/log-reporter';
import { PackedPackage } from '../core/pack-artifact';
import { Prefix } from '../core/type-utils';
import { GitSemverTag } from '../core/version-utils';
import { IProject, IWorkspace } from '../core/workspace-utils';

import { AzureDevopsPlugin } from './embedded/git/azure-devops';
import { GitPlatformDefault } from './embedded/git/default';
import { GithubPlugin } from './embedded/git/github';
import { NodeProject } from './embedded/node/node-project';
import { YarnPlugin } from './embedded/node/yarn';

export interface IGitPlatform {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
}

export interface IPackageManager {
  pack(workspace: IWorkspace, output: string): Promise<void>;
  publish(packedPackage: PackedPackage, releaseTag: string): Promise<void>;
}


export interface IPluginChangelogFunctions {
  renderCompareUrl?(from: GitSemverTag, to: GitSemverTag): string;
  renderCommitUrl?(commitHash: string): string;
  renderIssueUrl?(issueId: string): string;
}

// for Functions (here type Func)
type Func = (...p: any) => any;

// a mapping of a string key to an function can be created
type FuncMap = Record<string, Func>;

export type OptionalProps<Type extends FuncMap> = {
  [Property in keyof Type]: (...a: Parameters<Type[Property]>) => ReturnType<Type[Property]> | undefined;
};

export type IChangelogRenderFunctions = OptionalProps<Required<IPluginChangelogFunctions>>;

export interface IPluginHooks {
  onBump?(application: IApplication, workspace: IWorkspace, version: string): Promise<void> | void;
  onPublish?(application: IApplication, packedPackage: PackedPackage[]): Promise<void> | void;
}

export type DispatchablePluginHooks = Required<Prefix<IPluginHooks, 'dispatch'>>;

export interface IPlugin extends IPluginChangelogFunctions, IPluginHooks {
  name: string;
  gitPlatform?: IGitPlatform;
  project?: IProject;
  packageManager?: IPackageManager;
}

export interface IPluginInitialize extends IConfiguration {
  git: Git;
  executor: IExecutor;
  logger: LogReporter;
}

export interface IIntializablePlugin {
  /**
   * Initialize the plugin for the current configuration
   * @param configuration The configuration ref
   * @returns A boolean indicating of the plugin is valid for the current configuration
   */
  initialize(configuration: IPluginInitialize): Promise<IPlugin | null> | IPlugin | null;
}

export type NonInitializedPlugin = IPlugin | IIntializablePlugin;

export function isInitializable(p: NonInitializedPlugin): p is IIntializablePlugin {
  return 'initialize' in p && typeof p.initialize === 'function';
}

export class PluginManager implements IChangelogRenderFunctions, DispatchablePluginHooks {
  project?: IProject;
  packageManager?: IPackageManager;

  private _gitPlatform?: IGitPlatform;

  plugins: NonInitializedPlugin[] = [];
  availablePlugins: IPlugin[] = [];

  get gitPlatform(): IGitPlatform {
    return this._gitPlatform!;
  }

  constructor() {
    // Register defaults. Should be somewhere else i gues
    this.register(NodeProject);
    this.register(YarnPlugin);
    this.register(GithubPlugin);
    this.register(AzureDevopsPlugin);
  }

  renderCompareUrl(from: GitSemverTag, to: GitSemverTag) {
    return this.render('renderCompareUrl', from, to);
  }

  renderCommitUrl(commitHash: string) {
    return this.render('renderCommitUrl', commitHash);
  }

  renderIssueUrl(issueId: string) {
    return this.render('renderIssueUrl', issueId);
  }

  async initialize(configuration: IPluginInitialize) {
    const plugins = this.plugins.map(async plugin => {
      if (isInitializable(plugin)) {
        const result = await plugin.initialize(configuration);
        if (result) {
          return result;
        }
        return null;
      } else {
        return plugin;
      }
    });

    const result = await Promise.all(plugins);
    this.availablePlugins = result.filter((t): t is Awaited<IPlugin> => !!t).reverse();

    this.project = this.availablePlugins.find(plugin => !!plugin.project)?.project;
    this.packageManager = this.availablePlugins.find(plugin => !!plugin.packageManager)?.packageManager;

    const gitPlatform = this.availablePlugins.find(plugin => !!plugin.gitPlatform);
    if (gitPlatform) {
      this._gitPlatform = gitPlatform.gitPlatform!;
    } else {
      this._gitPlatform = GitPlatformDefault.initialize(configuration);
    }
  }

  register(plugin: NonInitializedPlugin) {
    this.plugins.push(plugin);
  }

  render<K extends keyof IPluginChangelogFunctions>(f: K, ...params: Parameters<Required<IPluginChangelogFunctions>[K]>): ReturnType<Required<IPluginChangelogFunctions>[K]> | undefined {
    for (const plugin of this.availablePlugins) {
      const func = plugin[f] as Function;
      if (func) {
        return func.call(plugin, ...params);
      }
    }
    return undefined;
  }

  async dispatchHook<K extends keyof IPluginHooks>(f: K, ...params: Parameters<Required<IPluginHooks>[K]>) {
    for (const plugin of this.availablePlugins) {
      const func = plugin[f] as Function;
      if (func) {
        await func.call(plugin, ...params);
      }
    }
  }

  async dispatchOnBump(application: IApplication, workspace: IWorkspace, version: string) {
    for (const plugin of this.availablePlugins) {
      await plugin.onBump?.(application, workspace, version);
    }
  }
  async dispatchOnPublish(application: IApplication, packedPackage: PackedPackage[]) {
    for (const plugin of this.availablePlugins) {
      await plugin.onPublish?.(application, packedPackage);
    }
  }
}
