import { GitCommit } from '../core/git';
import { GitSemverTag } from '../core/version-utils';
import { Project } from '../core/workspace-utils';

import { AzureDevops } from './embedded/azure-devops';
import { Github } from './embedded/github';
import { IPlugin, PluginManager } from './plugin';

export interface IGitPlatformPlugin extends IPlugin {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
  compareUrl(from: GitSemverTag, to: GitSemverTag): string;
  commitUrl(commitHash: string): string;
}


export class GitPlatformDefault implements IGitPlatformPlugin {
  private project?: Project;

  async initialize(_project: Project): Promise<boolean> {
    return true;
  }

  async currentBranch(): Promise<string | null> {
    return (await this.project?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    if (commit.message.startsWith('Merge pull request ')) {
      const lines = commit.message.split('\n');
      lines.splice(0, 2);
      return {
        ...commit,
        message: lines.join('\n').trim(),
      };
    } else {
      return commit;
    }
  }

  compareUrl(from: GitSemverTag, to: GitSemverTag) {
    console.log('LK:KJL:KJKLJKLJKLJKLJLKj');
    return `https://github.com/cp-utils/gitversion/compare/${from.version}...${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://github.com/cp-utils/gitversion/commit/${commit}`;
  }
}

export const gitPlatforms = new PluginManager<IGitPlatformPlugin>(new GitPlatformDefault());
gitPlatforms.register(new Github());
gitPlatforms.register(new AzureDevops());
