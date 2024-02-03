import { Git, GitCommit } from '../../../core/git';
import { GitSemverTag } from '../../../core/version-utils';
import { IPlugin, IPluginInitialize } from '../../plugin';

export class GithubPlugin implements IPlugin {
  name = 'Github platform plugin';

  get gitPlatform() {
    return this;
  }

  constructor(private git: Git, private projectName: string, private repoName: string) { }

  /**
   * Git url has the format: https://github.com/cp-utils/gitversion.git or git@github.com:cp-utils/gitversion.git
   */
  static parseUrl(url: string) {
    const result = /^(https:\/\/|git@)github.com(\/|:)(.+)\/(.+?)(\.git)?$/.exec(url);

    if (result) {
      return {
        projectName: result[3],
        repoName: result[4],
      };
    }
    return null;
  }

  static async initialize(initialize: IPluginInitialize): Promise<GithubPlugin | null> {
    const gitUrl = await initialize.git.remoteUrl();

    if (gitUrl) {
      const result = this.parseUrl(gitUrl);

      if (result) {
        return new GithubPlugin(initialize.git, result.projectName, result.repoName);
      }
    }
    return null;
  }

  async currentBranch(): Promise<string | null> {
    if (process.env.GITHUB_REF) {
      if (process.env.GITHUB_REF.startsWith('refs/heads/')) {
        return process.env.GITHUB_REF.replace('refs/heads/', '');
      } else {
        return null;
      }
    }

    return (await this.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
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
