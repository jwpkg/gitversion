import { colorize } from 'colorize-node';

import { detectBumpType, executeBump } from '../utils/bump-utils';
import { parseConventionalCommits } from '../utils/conventional-commmit-utils';
import { formatBumpType, formatPackageName } from '../utils/format-utils';
import { gitRoot } from '../utils/git';
import { LogReporter, logger } from '../utils/log-reporter';
import { Project, Workspace } from '../utils/workspace-utils';

import { RestoreCommand } from './restore';

export class BumpCommand extends RestoreCommand {
  static paths = [
    ['bump'],
  ];

  async execute(): Promise<number> {
    if ((await this.cli.run(['restore'])) !== 0) {
      return 1;
    }

    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    const bump = logger.beginSection('Bump step');

    await project.bumpManifest.clear();

    if (project.config.options.independentVersioning) {
      logger.reportInfo('➤ Independent versioning active. Bumping each package seperately');
      const promises = project.workspaces.map(async workspace => {
        return logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
          const newVersion = await this.detectBumpForWorkspace(workspace, logger);
          if (newVersion) {
            await workspace.updateVersion(newVersion, logger);
          }
        });
      });

      await Promise.all(promises);
    } else {
      const newVersion = await this.detectBumpForWorkspace(project, logger);

      if (newVersion) {
        await Promise.all(project.workspaces.map(w => w.updateVersion(newVersion, logger)));
      }
    }
    await project.bumpManifest.persist();
    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(workspace: Workspace, logger: LogReporter) {
    const version = await this.currentVersionFromGit(workspace);

    const platform = await workspace.project.git.platform();
    const logs = await workspace.project.git.logs(version.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, platform);

    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard`);

    const bumpType = detectBumpType(commits);

    logger.reportInfo(`Detected bump type: ${formatBumpType(bumpType)}`);

    const newVersion = executeBump(version.version, workspace.config.branch, bumpType);

    if (newVersion) {
      workspace.project.bumpManifest.add({
        changeLog: '',
        fromVersion: version.version.format(),
        packageName: workspace.packageName,
        packageRelativeCwd: workspace.relativeCwd,
        toVersion: newVersion,
        tag: workspace.tagPrefix + newVersion,
      });
    }
    return newVersion;
  }
}
