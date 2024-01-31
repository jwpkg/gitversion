import { GitCommit } from '../../core/git';
import { Project } from '../../core/workspace-utils';
import { IGitPlatformPlugin, IIntializablePlugin } from '../plugin';

export class GitPlatformDefault implements IGitPlatformPlugin, IIntializablePlugin {
  name = 'Standard git platform plugin';

  private project?: Project;

  initialize(project: Project) {
    this.project = project;
    return true;
  }

  async currentBranch(): Promise<string | null> {
    return (await this.project?.git.exec('rev-parse', '--abbrev-ref', 'HEAD')) ?? null;
  }

  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}
