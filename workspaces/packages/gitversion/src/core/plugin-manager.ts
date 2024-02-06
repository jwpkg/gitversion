import { GitPlatformDefault } from '../plugins/embedded/git/default';
import { embeddedPlugins } from '../plugins/embedded';

import { IApplication } from './application';
import { IConfiguration } from './configuration';
import { IExecutor } from './executor';
import { Git, GitCommit } from './git';
import { LogReporter } from './log-reporter';
import { PackedPackage } from './pack-artifact';
import { Prefix } from './type-utils';
import { GitSemverTag } from './version-utils';
import { IProject, IWorkspace } from './workspace-utils';

export interface IGitPlatform {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
}

export interface IPackManager {
  ident: string;
  pack(workspace: IWorkspace, outputFolder: string): Promise<string>;
  publish(packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean): Promise<void>;
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
  packManager?: IPackManager;
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
  packManagers: IPackManager[] = [];

  private _gitPlatform?: IGitPlatform;

  plugins: NonInitializedPlugin[] = [];
  availablePlugins: IPlugin[] = [];

  get gitPlatform(): IGitPlatform {
    return this._gitPlatform!;
  }

  constructor() {
    // Register embedded plugins. Should be somewhere else i gues
    embeddedPlugins.forEach(plugin => {
      this.register(plugin);
    });
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
    this.packManagers = this.availablePlugins
      .map(plugin => plugin.packManager)
      .filter((packManager): packManager is IPackManager => !!packManager);

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
