import { IBaseConfiguration } from '../../../core/configuration';
import { GitCommit } from '../../../core/git';
import { IGitPlatform } from '../../plugin';

export class GitPlatformDefault implements IGitPlatform {
  name = 'Standard git platform plugin';

  private constructor(private configuration?: IBaseConfiguration) {

  }

  static initialize(configuration: IBaseConfiguration) {
    return new GitPlatformDefault(configuration);
  }

  async currentBranch(): Promise<string | null> {
    return (await this.configuration?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}
