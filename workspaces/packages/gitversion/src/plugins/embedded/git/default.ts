import { IBaseConfiguration } from '../../../core/config';
import { GitCommit } from '../../../core/git';
import { IGitPlatformPlugin, IIntializablePlugin } from '../../plugin';

export class GitPlatformDefault implements IGitPlatformPlugin, IIntializablePlugin {
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
