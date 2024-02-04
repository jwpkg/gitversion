import { Application } from '../core/application';
import { DEFAULT_PACKAGE_VERSION } from '../core/constants';

import { GitVersionCommand } from './context';

export class ResetCommand extends GitVersionCommand {
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
      await workspace.updateVersion(DEFAULT_PACKAGE_VERSION);
    }));

    logger.endSection(reset);

    return 0;
  }
}
