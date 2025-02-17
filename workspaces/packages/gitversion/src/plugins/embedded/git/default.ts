import { Git, GitCommit } from '../../../core/git';
import { IGitPlatform, IPluginInitialize } from '../../../core/plugin-manager';

export class GitPlatformDefault implements IGitPlatform {
  name = 'Standard git platform plugin';

  private constructor(private git: Git) {

  }

  static initialize(initialize: IPluginInitialize) {
    return new GitPlatformDefault(initialize.git);
  }

  async currentBranch(): Promise<string | null> {
    return (await this.git.currentBranch()) ?? null;
  }

  async currentRef(): Promise<string | null> {
    return (await this.git.currentRef()) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}
