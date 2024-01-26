import { GitCommit } from '../../core/git';
import { GitSemverTag } from '../../core/version-utils';
import { Project } from '../../core/workspace-utils';
import { IGitPlatformPlugin } from '../git-platform';

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
