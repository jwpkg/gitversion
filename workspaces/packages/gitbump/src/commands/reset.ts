import { Application } from '../core/application';
import { DEFAULT_PACKAGE_VERSION } from '../core/constants';
import { updateWorkspaceVersion } from '../core/workspace-utils';

import { GitBumpCommand } from './context';

export class ResetCommand extends GitBumpCommand {
  static paths = [
    ['reset'],
  ];

  async execute(): Promise<number> {
    const { project, git, logger } = await Application.init(this.context.application);
    if (!project) {
      return 1;
    }

    const reset = logger.beginSection('Reset step');

    await git.cleanChangeLogs();

    await Promise.all(project.workspaces.map(async workspace => {
      await updateWorkspaceVersion(workspace, logger, DEFAULT_PACKAGE_VERSION);
    }));

    logger.endSection(reset);

    return 0;
  }
}
