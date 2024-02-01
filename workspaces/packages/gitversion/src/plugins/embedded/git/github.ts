import { IBaseConfiguration } from '../../../core/config';
import { GitCommit } from '../../../core/git';
import { GitSemverTag } from '../../../core/version-utils';
import { IIntializablePlugin, IPlugin } from '../../plugin';

export class GithubPlugin implements IPlugin, IIntializablePlugin {
  name = 'Github platform plugin';

  get gitPlatform() {
    return this;
  }

  private configuration?: IBaseConfiguration;
  /**
   * Git url has the format: https://github.com/cp-utils/gitversion.git or git@github.com:cp-utils/gitversion.git
   */
  private gitUrl: string = 'not_initialized';
  private projectName: string = 'not_initialized';
  private repoName: string = 'not_initialized';

  parseUrl(url: string) {
    const result = /^(https:\/\/|git@)github.com(\/|:)(.+)\/(.+?)(\.git)?$/.exec(url);

    if (result) {
      return {
        projectName: result[3],
        repoName: result[4],
      };
    }
    return null;
  }

  async initialize(configuration: IBaseConfiguration): Promise<boolean> {
    this.configuration = configuration;

    const gitUrl = await this.configuration.git.remoteUrl();

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

    return (await this.configuration?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
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

  renderCompareUrl(from: GitSemverTag, to: GitSemverTag) {
    return `https://github.com/${this.gitPlatform.projectName}/${this.gitPlatform.repoName}/compare/v${from.version}...v${to.version}`;
  }

  renderCommitUrl(commit: string) {
    return `https://github.com/${this.gitPlatform.projectName}/${this.gitPlatform.repoName}/commit/${commit}`;
  }
}
