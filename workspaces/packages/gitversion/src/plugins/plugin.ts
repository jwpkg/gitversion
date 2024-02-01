import { GitCommit } from '../core/git';
import { PackedPackage } from '../core/pack-artifact';
import { GitSemverTag } from '../core/version-utils';
import { IProject, IWorkspace } from '../core/workspace-utils';

import { AzureDevopsPlugin } from './embedded/azure-devops';
import { GitPlatformDefault } from './embedded/default';
import { GithubPlugin } from './embedded/github';

export interface IGitPlatformPlugin {
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
  onBump?(workspace: IWorkspace, version: string): Promise<void> | void;
  onPublish?(project: IProject, packedPackage: PackedPackage[], dryRun: boolean): Promise<void> | void;
}

export interface IPlugin extends IPluginChangelogFunctions, IPluginHooks {
  name: string;
  gitPlatform?: IGitPlatformPlugin;

}

export interface IIntializablePlugin {
  /**
   * Initialize the plugin for the current project
   * @param project The project instance
   * @returns A boolean indicating of the plugin is valid for the current project
   */
  initialize(project: IProject): Promise<boolean> | boolean;
}

export function isInitializable(p: any): p is IIntializablePlugin {
  return 'initialize' in p && typeof p.initialize === 'function';
}

export class PluginManager implements IChangelogRenderFunctions {
  plugins: IPlugin[] = [];
  availablePlugins: IPlugin[] = [];

  gitPlatform: IGitPlatformPlugin;

  constructor() {
    this.gitPlatform = new GitPlatformDefault();

    // Register defaults. Should be somewhere else i gues
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

  async initialize(project: IProject) {
    const plugins = this.plugins.map(async plugin => {
      if (isInitializable(plugin)) {
        const initialize = await plugin.initialize(project);
        if (initialize) {
          return plugin;
        }
        return null;
      } else {
        return plugin;
      }
    });

    const result = await Promise.all(plugins);
    this.availablePlugins = result.filter((t): t is Awaited<IPlugin> => !!t).reverse();

    const gitPlatform = this.availablePlugins.find(plugin => !!plugin.gitPlatform);
    if (gitPlatform) {
      this.gitPlatform = gitPlatform.gitPlatform!;
    } else {
      const defaultGit = new GitPlatformDefault();
      defaultGit.initialize(project);
      this.gitPlatform = defaultGit;
    }
  }

  register(plugin: IPlugin) {
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

  async dispatchOnBump(workspace: IWorkspace, version: string) {
    for (const plugin of this.availablePlugins) {
      await plugin.onBump?.(workspace, version);
    }
  }
  async dispatchOnPublish(project: IProject, packedPackage: PackedPackage[], dryRun: boolean) {
    for (const plugin of this.availablePlugins) {
      await plugin.onPublish?.(project, packedPackage, dryRun);
    }
  }
}
