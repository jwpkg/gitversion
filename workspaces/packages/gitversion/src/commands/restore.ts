import { Application } from '../core/application';
import { BumpManifest } from '../core/bump-manifest';
import { VersionBranch } from '../core/configuration';
import { formatVersion, formatVersionBranch } from '../core/format-utils';
import { Git } from '../core/git';
import { determineCurrentVersion } from '../core/version-utils';
import { IWorkspace } from '../core/workspace-utils';

import { GitVersionCommand } from './context';

export class RestoreCommand extends GitVersionCommand {
  static paths = [
    ['restore'],
  ];

  async execute(): Promise<number> {
    const { project, configuration, git, branch, logger } = await Application.init(this.context.application);
    if (!project) {
      return 1;
    }

    logger.reportInfo(`Branch type: ${formatVersionBranch(branch)}`);
    const section = logger.beginSection('Restore step');

    await BumpManifest.clear(configuration);

    if (configuration.options.independentVersioning) {
      const promises = project.workspaces.map(async workspace => {
        const version = await this.currentVersionFromGit(workspace, git, branch);
        await workspace.updateVersion(version.version);
      });
      await Promise.all(promises);
    } else {
      const version = await this.currentVersionFromGit(project, git, branch);

      logger.reportInfo(`Latest version in git tags: ${formatVersion(version.version)}`);

      await Promise.all(project.workspaces.map(w => w.updateVersion(version.version)));
    }

    logger.endSection(section);
    return 0;
  }

  async currentVersionFromGit(workspace: IWorkspace, git: Git, branch: VersionBranch) {
    const tags = await git.versionTags(workspace.tagPrefix);
    return determineCurrentVersion(tags, branch, workspace.tagPrefix);
  }
}
