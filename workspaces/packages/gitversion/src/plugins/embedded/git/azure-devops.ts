import { IBaseConfiguration } from '../../../core/config';
import { GitCommit } from '../../../core/git';
import { GitSemverTag } from '../../../core/version-utils';
import { IGitPlatformPlugin, IIntializablePlugin, IPlugin } from '../../plugin';

export class AzureDevopsPlugin implements IPlugin, IIntializablePlugin, IGitPlatformPlugin {
  name = 'Azure devops platform plugin';

  get gitPlatform() {
    return this;
  }

  private configuration?: IBaseConfiguration;

  private organizationName: string = '';
  private projectName: string = '';
  private repoName: string = '';

  parseUrl(url: string) {
    const httpsRegex = /^https:\/\/.*dev\.azure\.com\/(.*)\/(.*)\/_git\/(.*)$/;
    const sshRegex = /^git@ssh\.dev\.azure\.com:.*\/(.*)\/(.*)\/(.*)$/;

    const httpsMatch = httpsRegex.exec(url);
    if (httpsMatch) {
      return {
        organizationName: httpsMatch[1],
        projectName: httpsMatch[2],
        repoName: httpsMatch[3],
      };
    }
    const sshMatch = sshRegex.exec(url);
    if (sshMatch) {
      return {
        organizationName: sshMatch[1],
        projectName: sshMatch[2],
        repoName: sshMatch[3],
      };
    }
    return null;
  }

  async initialize(configuration: IBaseConfiguration): Promise<boolean> {
    this.configuration = configuration;

    const gitUrl = await this.configuration.git.remoteUrl();

    if (gitUrl) {
      const result = this.parseUrl(gitUrl);

      if (result) {
        this.organizationName = result.organizationName;
        this.projectName = result.projectName;
        this.repoName = result.repoName;
      }

      return true;
    }
    return false;
  }

  async currentBranch(): Promise<string | null> {
    if (process.env.BUILD_SOURCEBRANCH) {
      if (process.env.BUILD_SOURCEBRANCH.startsWith('refs/heads/')) {
        return process.env.BUILD_SOURCEBRANCH.replace('refs/heads/', '');
      } else {
        return null;
      }
    }

    return (await this.configuration?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    if (commit.message.match(/^Merged PR \\d+: /)) {
      return {
        ...commit,
        message: commit.message.replace(/^Merged PR \\d+: /, ''),
      };
    } else {
      return commit;
    }
  }

  compareUrl(from: GitSemverTag, to: GitSemverTag) {
    return `https://dev.azure.com/${this.organizationName}/${this.projectName}/_git/${this.repoName}/branchCompare?baseVersion=GT${from.version}&targetVersion=GT${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://dev.azure.com/${this.organizationName}/${this.projectName}/_git/${this.repoName}/commit/${commit}`;
  }
}
