import { colorize } from 'colorize-node';

import { Configuration } from '../config';
import { detectBumpType, executeBump } from '../utils/bump-utils';
import { parseConventionalCommits } from '../utils/conventional-commmit-utils';
import { formatBumpType } from '../utils/format-utils';
import { tagPrefix } from '../utils/git-utils';
import { Git, gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { determineCurrentVersion } from '../utils/version-utils';
import { Project } from '../utils/workspace-utils';

import { RestoreCommand } from './restore';

export class BumpCommand extends RestoreCommand {
  static paths = [
    ['bump'],
  ];

  async execute(): Promise<number> {
    if ((await this.cli.run(['restore'])) !== 0) {
      return 1;
    }

    const bump = logger.beginSection('Bump step');
    const project = await Project.load(await gitRoot());
    const config = await Configuration.load(project.cwd);
    if (!config) {
      return 1;
    }
    const git = new Git(project.cwd);

    const tags = await git.versionTags();
    const version = determineCurrentVersion(tags, config.branch, tagPrefix());

    const platform = await git.platform();
    const logs = (await git.logs(version.hash)).map(platform.stripMergeMessage);
    const commits = parseConventionalCommits(logs);
    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard`);

    const bumpType = detectBumpType(commits);

    logger.reportInfo(`Detected bump type: ${formatBumpType(bumpType)}`);

    const newVersion = executeBump(version.version, config.branch, bumpType);

    if (newVersion) {
      await Promise.all(project.workspaces.map(w => w.updateVersion(newVersion)));
    }
    logger.endSection(bump);
    return 0;
  }
}
