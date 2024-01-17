import { Configuration } from '../config';
import { formatVersion, formatVersionBranch } from '../utils/format-utils';
import { tagPrefix } from '../utils/git-utils';
import { Git, gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { determineCurrentVersion } from '../utils/version-utils';
import { Project } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class RestoreCommand extends GitVersionCommand {
  static paths = [
    ['restore'],
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

    const git = new Git(project.cwd);
    logger.reportInfo(`Branch type: ${formatVersionBranch(config.branch)}`);

    const detect = logger.beginSection('Restore step');
    const tags = await git.versionTags();
    const version = determineCurrentVersion(tags, config.branch, tagPrefix());
    logger.reportInfo(`Latest version in git tags: ${formatVersion(version.version)}`);

    await Promise.all(project.workspaces.map(w => w.updateVersion(version.version.format())));
    logger.endSection(detect);
    return 0;
  }
}
