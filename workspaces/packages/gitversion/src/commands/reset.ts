import { DEFAULT_PACKAGE_VERSION } from '../core/constants';
import { gitRoot } from '../core/git';
import { logger } from '../core/log-reporter';
import { Project } from '../core/workspace-utils';

import { GitVersionCommand } from './context';

export class ResetCommand extends GitVersionCommand {
  static paths = [
    ['reset'],
  ];

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    const reset = logger.beginSection('Reset step');

    await project.git.cleanChangeLogs();

    await Promise.all(project.workspaces.map(async workspace => {
      await workspace.updateVersion(DEFAULT_PACKAGE_VERSION, logger);
    }));

    logger.endSection(reset);

    return 0;
  }
}
