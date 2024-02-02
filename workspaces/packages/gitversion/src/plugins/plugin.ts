import { IBaseConfiguration, IConfiguration } from '../core/configuration';
import { GitCommit } from '../core/git';
import { PackedPackage } from '../core/pack-artifact';
import { GitSemverTag } from '../core/version-utils';
import { IProject, IWorkspace } from '../core/workspace-utils';

import { AzureDevopsPlugin } from './embedded/git/azure-devops';
import { GitPlatformDefault } from './embedded/git/default';
import { GithubPlugin } from './embedded/git/github';
import { NodeProject } from './embedded/node/node-project';

export interface IGitPlatform {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
}

export interface IPackageManagerPlugin {
  pack(workspace: IWorkspace): Promise<string>;
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

export type Prefix<Type, Prefix extends string> = {
  [Property in keyof Type as `${Prefix}${string & Property}`]: Type[Property]
};

export interface IPluginHooks {
  onBump?(workspace: IWorkspace, configuration: IConfiguration, version: string): Promise<void> | void;
  onPublish?(project: IProject, configuration: IConfiguration, packedPackage: PackedPackage[], dryRun: boolean): Promise<void> | void;
}

export interface IPlugin extends IPluginChangelogFunctions, IPluginHooks {
  name: string;
  gitPlatform?: IGitPlatform;
  project?: IProject;
}

export interface IIntializablePlugin {
  /**
   * Initialize the plugin for the current configuration
   * @param configuration The configuration ref
   * @returns A boolean indicating of the plugin is valid for the current configuration
   */
  initialize(configuration: IBaseConfiguration): Promise<boolean> | boolean;
}

/**
 * Initialize the plugin for the current configuration
 * @param configuration The configuration ref
 * @returns A boolean indicating of the plugin is valid for the current configuration
 */
export type StaticInitializablePlugin = (configuration: IBaseConfiguration) => Promise<IPlugin | null>;

export type NonInitializedPlugin = StaticInitializablePlugin | IPlugin | IIntializablePlugin;

export function isInitializable(p: NonInitializedPlugin): p is IIntializablePlugin {
  return 'initialize' in p && typeof p.initialize === 'function';
}

export function isStaticInitializablePlugin(p: NonInitializedPlugin): p is StaticInitializablePlugin {
  return typeof p === 'function';
}

export class PluginManager implements IChangelogRenderFunctions {
  project?: IProject;

  plugins: NonInitializedPlugin[] = [];
  availablePlugins: IPlugin[] = [];

  gitPlatform: IGitPlatform;

  constructor() {
    this.gitPlatform = new GitPlatformDefault();

    // Register defaults. Should be somewhere else i gues
    this.register(NodeProject.initialize);

    this.register(new GithubPlugin());
    this.register(new AzureDevopsPlugin());
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

  async initialize(configuration: IBaseConfiguration) {
    const plugins = this.plugins.map(async plugin => {
      if (isInitializable(plugin)) {
        const initialize = await plugin.initialize(configuration);
        if (initialize) {
          return plugin;
        }
        return null;
      } else if (isStaticInitializablePlugin(plugin)) {
        return await plugin(configuration);
      } else {
        return plugin;
      }
    });

    const result = await Promise.all(plugins);
    this.availablePlugins = result.filter((t): t is Awaited<IPlugin> => !!t).reverse();

    this.project = this.availablePlugins.find(plugin => !!plugin.project)?.project;

    const gitPlatform = this.availablePlugins.find(plugin => !!plugin.gitPlatform);
    if (gitPlatform) {
      this.gitPlatform = gitPlatform.gitPlatform!;
    } else {
      const defaultGit = new GitPlatformDefault();
      defaultGit.initialize(configuration);
      this.gitPlatform = defaultGit;
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

  async dispatchOnBump(workspace: IWorkspace, configuration: IConfiguration, version: string) {
    for (const plugin of this.availablePlugins) {
      await plugin.onBump?.(workspace, configuration, version);
    }
  }
  async dispatchOnPublish(project: IProject, configuration: IConfiguration, packedPackage: PackedPackage[], dryRun: boolean) {
    for (const plugin of this.availablePlugins) {
      await plugin.onPublish?.(project, configuration, packedPackage, dryRun);
    }
  }
}
