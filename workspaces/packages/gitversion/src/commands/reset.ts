import { BumpManifest } from '../utils/bump-manifest';
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
    if (!project) {
      return 1;
    }

    const reset = logger.beginSection('Reset step');

    await BumpManifest.clear(project);

    await Promise.all(project.workspaces.map(w => w.updateVersion(DEFAULT_PACKAGE_VERSION, logger)));

    logger.endSection(reset);

    return 0;
  }
}
