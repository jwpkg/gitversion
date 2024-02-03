import { Application } from '../core/application';
import { DEFAULT_PACKAGE_VERSION } from '../core/constants';
import { Git } from '../core/git';
import { logger } from '../core/log-reporter';

import { GitVersionCommand } from './context';

export class ResetCommand extends GitVersionCommand {
  static paths = [
    ['reset'],
  ];

  async execute(): Promise<number> {
    const { project, git } = await Application.init(await Git.root());
    if (!project) {
      return 1;
    }

    const reset = logger.beginSection('Reset step');

    await git.cleanChangeLogs();

    await Promise.all(project.workspaces.map(async workspace => {
      await workspace.updateVersion(DEFAULT_PACKAGE_VERSION, logger);
    }));

    logger.endSection(reset);

    return 0;
  }
}
