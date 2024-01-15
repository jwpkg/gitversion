import { Command } from 'clipanion';

import { DEFAULT_PACKAGE_VERSION } from '../utils/constants';
import { gitRoot } from '../utils/git';
import { Project } from '../utils/workspace-utils';

export class ResetCommand extends Command {
  static paths = [
    ['reset'],
  ];

  async execute() {
    const project = await Project.load(await gitRoot());

    await Promise.all(project.workspaces.map(w => w.updateVersion(DEFAULT_PACKAGE_VERSION)));
  }
}
