import { GitCommit } from '../core/git';
import { GitSemverTag } from '../core/version-utils';
import { Project } from '../core/workspace-utils';

import { AzureDevops } from './embedded/azure-devops';
import { Github } from './embedded/github';
import { IPlugin, PluginManager } from './plugin';

export interface IGitPlatformPlugin extends IPlugin {
  currentBranch(): Promise<string | null>;
  stripMergeMessage(commit: GitCommit): GitCommit;
  compareUrl(from: GitSemverTag, to: GitSemverTag): string | null;
  commitUrl(commitHash: string): string | null;
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
    return commit;
  }

  compareUrl(_from: GitSemverTag, _to: GitSemverTag) {
    return null;
  }

  commitUrl(_commit: string) {
    return null;
  }
}

export const gitPlatforms = new PluginManager<IGitPlatformPlugin>(new GitPlatformDefault());
gitPlatforms.register(new Github());
gitPlatforms.register(new AzureDevops());
