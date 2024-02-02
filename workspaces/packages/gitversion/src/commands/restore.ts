import { BumpManifest } from '../core/bump-manifest';
import { Configuration } from '../core/configuration';
import { formatVersion, formatVersionBranch } from '../core/format-utils';
import { Git } from '../core/git';
import { logger } from '../core/log-reporter';
import { determineCurrentVersion } from '../core/version-utils';
import { IWorkspace } from '../core/workspace-utils';

import { GitVersionCommand } from './context';

export class RestoreCommand extends GitVersionCommand {
  static paths = [
    ['restore'],
  ];

  async execute(): Promise<number> {
    const { project } = await Configuration.load(await Git.root());
    if (!project) {
      return 1;
    }

    logger.reportInfo(`Branch type: ${formatVersionBranch(project.config.branch)}`);
    const section = logger.beginSection('Restore step');

    await BumpManifest.clear(project);

    if (project.config.options.independentVersioning) {
      const promises = project.workspaces.map(async workspace => {
        const version = await this.currentVersionFromGit(workspace);
        await workspace.updateVersion(version.version, logger);
      });
      await Promise.all(promises);
    } else {
      const version = await this.currentVersionFromGit(project);

      logger.reportInfo(`Latest version in git tags: ${formatVersion(version.version)}`);

      await Promise.all(project.workspaces.map(w => w.updateVersion(version.version, logger)));
    }

    logger.endSection(section);
    return 0;
  }

  async currentVersionFromGit(workspace: IWorkspace) {
    const tags = await workspace.project.git.versionTags(workspace.tagPrefix);
    return determineCurrentVersion(tags, workspace.config.branch, workspace.tagPrefix);
  }
}
