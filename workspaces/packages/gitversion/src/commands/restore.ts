import { BumpManifest } from '../utils/bump-manifest';
import { formatVersion, formatVersionBranch } from '../utils/format-utils';
import { gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { determineCurrentVersion } from '../utils/version-utils';
import { Project, Workspace } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class RestoreCommand extends GitVersionCommand {
  static paths = [
    ['restore'],
  ];

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
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

  async currentVersionFromGit(workspace: Workspace) {
    const tags = await workspace.project.git.versionTags(workspace.tagPrefix);

    const version = determineCurrentVersion(tags, workspace.config.branch, workspace.tagPrefix);
    // if (!version.hash && workspace.tagPrefix !== workspace.config.options.versionTagPrefix) {
    //   const tags = await workspace.project.git.versionTags(workspace.project.tagPrefix);
    //   return determineCurrentVersion(tags, workspace.config.branch, workspace.project.tagPrefix);
    // }
    return version;
  }
}
