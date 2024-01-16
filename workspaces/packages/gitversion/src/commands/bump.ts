import { Command } from 'clipanion';

import { Configuration } from '../config';
import { detectBumpType, executeBump } from '../utils/bump-utils';
import { parseConventionalCommits } from '../utils/conventional-commmit-utils';
import { tagPrefix } from '../utils/git-utils';
import { Git, gitRoot } from '../utils/git';
import { determineCurrentVersion } from '../utils/version-utils';
import { Project } from '../utils/workspace-utils';

export class BumpCommand extends Command {
  static paths = [
    ['bump'],
  ];

  async execute() {
    const project = await Project.load(await gitRoot());
    const config = await Configuration.load(project.cwd);

    const git = new Git(project.cwd);
    const tags = await git.versionTags();
    const version = determineCurrentVersion(tags, config.branch, tagPrefix());
    console.log('VERSION FOUND:', version);

    const platform = await git.platform();
    const logs = (await git.logs(version.hash)).map(platform.stripMergeMessage);
    const commits = parseConventionalCommits(logs);

    const bumpType = detectBumpType(commits);

    const newVersion = executeBump(version.version, config.branch, bumpType);

    if (newVersion) {
      await Promise.all(project.workspaces.map(w => w.updateVersion(newVersion)));
    }
  }
}
