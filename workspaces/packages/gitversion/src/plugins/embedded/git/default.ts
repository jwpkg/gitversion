import { IBaseConfiguration } from '../../../core/configuration';
import { GitCommit } from '../../../core/git';
import { IGitPlatform, IIntializablePlugin } from '../../plugin';

export class GitPlatformDefault implements IGitPlatform, IIntializablePlugin {
  name = 'Standard git platform plugin';

  private configuration?: IBaseConfiguration;

  initialize(configuration: IBaseConfiguration) {
    this.configuration = configuration;
    return true;
  }

  async currentBranch(): Promise<string | null> {
    return (await this.configuration?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}
