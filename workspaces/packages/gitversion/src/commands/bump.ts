import { colorize } from 'colorize-node';

import { BranchType } from '../config';
import { BumpManifest } from '../utils/bump-manifest';
import { BumpType, detectBumpType, executeBump } from '../utils/bump-utils';
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

    const bumpManifest = new BumpManifest(project);

    await bumpManifest.clear();

    if (project.config.options.independentVersioning) {
      logger.reportInfo('➤ Independent versioning active. Bumping each package seperately');
      const promises = project.workspaces.map(async workspace => {
        return logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
          const newVersion = await this.detectBumpForWorkspace(workspace, logger, bumpManifest);
          if (newVersion) {
            await workspace.updateVersion(newVersion, logger);
          }
        });
      });

      await Promise.all(promises);
    } else {
      const newVersion = await this.detectBumpForWorkspace(project, logger, bumpManifest);

      if (newVersion) {
        await Promise.all(project.workspaces.map(w => w.updateVersion(newVersion, logger)));
      }
    }
    await bumpManifest.persist();
    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(workspace: Workspace, logger: LogReporter, bumpManifest: BumpManifest) {
    const version = await this.currentVersionFromGit(workspace);

    const platform = await workspace.project.git.platform();
    const logs = await workspace.project.git.logs(version.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, platform);

    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard`);

    let bumpType = detectBumpType(commits);

    logger.reportInfo(`Detected bump type: ${formatBumpType(bumpType)}`);

    if (bumpType === BumpType.NONE
      && logs.length > 0
      && workspace.config.branch.type === BranchType.FEATURE
      && workspace.config.options.alwaysBumpFeatureCommits) {
      bumpType = BumpType.PATCH;
      logger.reportInfo(`Found ${colorize.cyan(commits.length)} normal commits and will bump feature branch with ${colorize.bgGreen('PATCH')}`);
    }

    const newVersion = executeBump(version.version, workspace.config.branch, bumpType);

    if (newVersion) {
      bumpManifest.add({
        changeLog: '',
        fromVersion: version.version.format(),
        packageName: workspace.packageName,
        packageRelativeCwd: workspace.relativeCwd,
        toVersion: newVersion,
        tag: workspace.tagPrefix + newVersion,
        private: workspace.manifest.private === true,
      });
    }
    return newVersion;
  }
}
