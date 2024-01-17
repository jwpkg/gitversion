import { Configuration } from '../config';
import { DEFAULT_PACKAGE_VERSION } from '../utils/constants';
import { gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { Project } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class ResetCommand extends GitVersionCommand {
  static paths = [
    ['reset'],
  ];

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    const config = await Configuration.load(project.cwd);
    if (!config) {
      return 1;
    }

    if (config.options.independentVersioning) {
      logger.reportError('Independenversioning not yet supported for <restore>');
      return 1;
    }

    const reset = logger.beginSection('Reset step');

    await Promise.all(project.workspaces.map(w => w.updateVersion(DEFAULT_PACKAGE_VERSION)));
    logger.endSection(reset);

    return 0;
  }
}
