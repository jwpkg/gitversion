import { GitCommit } from '../core/git';
import { GitSemverTag } from '../core/version-utils';

import { IPlugin, PluginManager } from './plugin';

export interface IGitPlatformPlugin extends IPlugin {
  currentBranch(): string;
  stripMergeMessage(commit: GitCommit): GitCommit;
  compareUrl(from: GitSemverTag, to: GitSemverTag): string;
  commitUrl(commitHash: string): string;
}

export const gitPlatforms = new PluginManager<IGitPlatformPlugin>();
