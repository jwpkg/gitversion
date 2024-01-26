import { GitCommit } from '../../core/git';
import { GitSemverTag } from '../../core/version-utils';
import { Project } from '../../core/workspace-utils';
import { IGitPlatformPlugin } from '../git-platform';

export class Github implements IGitPlatformPlugin {
  private project?: Project;
  /**
   * Git url has the format: https://github.com/cp-utils/gitversion.git or git@github.com:cp-utils/gitversion.git
   */
  private gitUrl: string = 'not_initialized';
  private projectName: string = 'not_initialized';
  private repoName: string = 'not_initialized';

  parseUrl(url: string) {
    const result = /^(https:\/\/|git@)github.com(\/|:)(.+)\/(.+)\.git$/.exec(url);

    if (result) {
      return {
        projectName: result[3],
        repoName: result[4],
      };
    }
    return null;
  }

  async initialize(project: Project): Promise<boolean> {
    this.project = project;

    const gitUrl = await this.project.git.remoteUrl();
    console.log(gitUrl);

    if (gitUrl) {
      this.gitUrl = gitUrl;
      const result = this.parseUrl(gitUrl);

      if (result) {
        this.projectName = result.projectName;
        this.repoName = result.repoName;
      }

      return this.gitUrl.includes('github.com');
    }
    return false;
  }

  async currentBranch(): Promise<string | null> {
    if (process.env.GITHUB_REF) {
      if (process.env.GITHUB_REF.startsWith('refs/heads/')) {
        return process.env.GITHUB_REF.replace('refs/heads/', '');
      } else {
        return null;
      }
    }

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
    return `https://github.com/${this.projectName}/${this.repoName}/compare/${from.version}...${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://github.com/${this.projectName}/${this.repoName}/commit/${commit}`;
  }
}
