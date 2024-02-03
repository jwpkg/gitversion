import { Git, GitCommit } from '../../../core/git';
import { IGitPlatform, IPluginInitialize } from '../../plugin';

export class GitPlatformDefault implements IGitPlatform {
  name = 'Standard git platform plugin';

  private constructor(private git: Git) {

  }

  static initialize(initialize: IPluginInitialize) {
    return new GitPlatformDefault(initialize.git);
  }

  async currentBranch(): Promise<string | null> {
    return (await this.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}
