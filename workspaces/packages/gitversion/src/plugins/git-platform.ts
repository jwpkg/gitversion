import { GitCommit } from '../core/git';
import { GitSemverTag } from '../core/version-utils';

import { AzureDevops } from './embedded/azure-devops';
import { GitPlatformDefault } from './embedded/default';
import { Github } from './embedded/github';
import { IPlugin, PluginManager } from './plugin';

export interface IGitPlatformPlugin extends IPlugin {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
  compareUrl(from: GitSemverTag, to: GitSemverTag): string | null;
  commitUrl(commitHash: string): string | null;
}

export const gitPlatforms = new PluginManager<IGitPlatformPlugin>(new GitPlatformDefault());
gitPlatforms.register(new Github());
gitPlatforms.register(new AzureDevops());
