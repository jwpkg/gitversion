import { Command } from 'clipanion';

import { Configuration } from '../config';
import { tagPrefix } from '../utils/git-utils';
import { Git, gitRoot } from '../utils/git';
import { determineCurrentVersion } from '../utils/version-utils';
import { Project } from '../utils/workspace-utils';

export class RestoreCommand extends Command {
  static paths = [
    ['restore'],
  ];

  async execute() {
    const project = await Project.load(await gitRoot());
    const config = await Configuration.load(project.cwd);

    const git = new Git(project.cwd);
    const tags = await git.versionTags();
    const version = determineCurrentVersion(tags, config.branch, tagPrefix());
    console.log('VERSION FOUND:', version);

    await Promise.all(project.workspaces.map(w => w.updateVersion(version.version)));
  }
}
