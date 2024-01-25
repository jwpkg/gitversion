import { GitCommit } from '../../core/git';
import { GitSemverTag } from '../../core/version-utils';
import { Project } from '../../core/workspace-utils';
import { IGitPlatformPlugin } from '../git-platform';

export class Github implements IGitPlatformPlugin {
  private project?: Project;

  async initialize(project: Project): Promise<boolean> {
    this.project = project;
  }

  currentBranch(): string {
    throw new Error('Method not implemented.');
  }
  stripMergeMessage(commit: GitCommit): GitCommit {
    if (commit.subject.startsWith('Merge pull request ')) {
      const lines = commit.body.split('\n');
      const subject = lines.splice(0, 1)[0];
      const body = lines.join('\n').trim();
      return {
        ...commit,
        subject,
        body,
      };
    } else {
      return commit;
    }
  }

  compareUrl(from: GitSemverTag, to: GitSemverTag) {
    return `https://github.com/cp-utils/gitversion/compare/${from.version}...${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://github.com/cp-utils/gitversion/commit/${commit}`;
  }
}
