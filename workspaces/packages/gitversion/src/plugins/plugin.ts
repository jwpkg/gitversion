import { GitCommit } from '../core/git';
import { PackedPackage } from '../core/pack-artifact';
import { GitSemverTag } from '../core/version-utils';
import { Project, Workspace } from '../core/workspace-utils';

import { AzureDevopsPlugin } from './embedded/azure-devops';
import { GitPlatformDefault } from './embedded/default';
import { GithubPlugin } from './embedded/github';

export interface IGitPlatformPlugin {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
  compareUrl(from: GitSemverTag, to: GitSemverTag): string | null;
  commitUrl(commitHash: string): string | null;
}

export interface IPluginHook {
  onBump?: (workspace: Workspace, version: string) => Promise<void> | void;
  onPublish?: (project: Project, packedPackage: PackedPackage[], dryRun: boolean) => Promise<void> | void;
}

export interface IPlugin {
  name: string;
  gitPlatform?: IGitPlatformPlugin;
  hooks?: IPluginHook;
}

export interface IIntializablePlugin {
  /**
   * Initialize the plugin for the current project
   * @param project The project instance
   * @returns A boolean indicating of the plugin is valid for the current project
   */
  initialize(project: Project): Promise<boolean>;
}

export function isInitializable(p: any): p is IIntializablePlugin {
  return 'initialize' in p && typeof p.initialize === 'function';
}

export class PluginManager {
  plugins: IPlugin[] = [];
  availablePlugins: IPlugin[] = [];

  gitPlatform: IGitPlatformPlugin;

  constructor() {
    this.gitPlatform = new GitPlatformDefault();

    // Register defaults. Should be somewhere else i gues
    this.register(new GithubPlugin());
    this.register(new AzureDevopsPlugin());
  }

  async initialize(project: Project) {
    const plugins = this.plugins.map(async plugin => {
      if (isInitializable(plugin)) {
        if (await plugin.initialize(project)) {
          return plugin;
        } else {
          return null;
        }
      } else {
        return plugin;
      }
    });

    const result = await Promise.all(plugins);
    this.availablePlugins = result.filter((t): t is Awaited<IPlugin> => !!t);

    const gitPlatform = this.availablePlugins.find(plugin => !!plugin.gitPlatform);
    if (gitPlatform) {
      this.gitPlatform = gitPlatform.gitPlatform!;
    } else {
      const defaultGit = new GitPlatformDefault();
      await defaultGit.initialize(project);
      this.gitPlatform = defaultGit;
    }
  }

  register(plugin: IPlugin) {
    this.plugins.push(plugin);
  }

  async dispatchOnBump(workspace: Workspace, version: string) {
    for (const plugin of this.availablePlugins) {
      const result = plugin.hooks?.onBump?.(workspace, version);
      if (result instanceof Promise) {
        await result;
      }
    }
  }
  async dispatchOnPublish(project: Project, packedPackage: PackedPackage[], dryRun: boolean) {
    for (const plugin of this.availablePlugins) {
      const result = plugin.hooks?.onPublish?.(project, packedPackage, dryRun);
      if (result instanceof Promise) {
        await result;
      }
    }
  }
}
