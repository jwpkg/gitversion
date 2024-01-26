import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import * as t from 'typanion';

import { BumpManifest } from '../core/bump-manifest';
import { BumpType, detectBumpType, executeBump, validateBumpType } from '../core/bump-utils';
import { generateChangeLogEntry } from '../core/changelog';
import { parseConventionalCommits } from '../core/conventional-commmit-utils';
import { formatBumpType, formatPackageName } from '../core/format-utils';
import { Git } from '../core/git';
import { LogReporter, logger } from '../core/log-reporter';
import { GitSemverTag } from '../core/version-utils';
import { Project, Workspace } from '../core/workspace-utils';
import { IGitPlatformPlugin } from '../plugins/git-platform';

import { RestoreCommand } from './restore';

export class BumpCommand extends RestoreCommand {
  static paths = [
    ['bump'],
  ];

  version = Option.String('--version', {
    description: 'Bump with an explicit version',
  });

  bumpType = Option.String('--bumpType', {
    description: 'Bump with an explicit version',
    validator: t.isEnum([BumpType.GRADUATE, BumpType.MAJOR, BumpType.MINOR, BumpType.PATCH]),
  });

  async execute(): Promise<number> {
    if ((await this.cli.run(['restore'])) !== 0) {
      return 1;
    }

    const project = await Project.load(await Git.root());
    if (!project) {
      return 1;
    }

    const bump = logger.beginSection('Bump step');

    const bumpManifest = await BumpManifest.new(project);

    if (!this.version && project.config.options.independentVersioning === false) {
      this.version = await this.detectBumpForWorkspace(project, logger, bumpManifest, undefined, this.bumpType);
    }

    const promises = project.workspaces.map(async workspace => {
      return logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
        const newVersion = await this.detectBumpForWorkspace(workspace, logger, bumpManifest, this.version, this.bumpType);
        if (newVersion) {
          await workspace.updateVersion(newVersion, logger);
        }
      });
    });

    await Promise.all(promises);
    await bumpManifest.persist();

    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(workspace: Workspace, logger: LogReporter, bumpManifest: BumpManifest, explicitVersion?: string, explicitBumpType?: BumpType) {
    let newVersion: string | undefined;
    const workspaceForVersion = workspace.config.options.independentVersioning ? workspace : workspace.project;
    const currentVersion = await this.currentVersionFromGit(workspaceForVersion);
    const platform = await workspace.project.gitPlatform;

    if (!explicitVersion) {
      const logs = await workspace.project.git.logs(currentVersion.hash, workspaceForVersion.relativeCwd);
      const commits = parseConventionalCommits(logs, platform);

      logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);

      const bumpType = explicitBumpType ?? validateBumpType(detectBumpType(commits), logs, workspace.config);

      logger.reportInfo(`Bump type: ${formatBumpType(bumpType)}`);
      newVersion = executeBump(currentVersion.version, workspace.config.branch, bumpType) ?? undefined;
    } else {
      newVersion = explicitVersion;
    }

    if (newVersion) {
      await this.generateChangelogForWorkspace(workspace, currentVersion, {
        version: newVersion,
        hash: await workspace.project.git.currentCommit(),
      }, platform, bumpManifest, logger);
    }
    return newVersion;
  }

  private async generateChangelogForWorkspace(workspace: Workspace, fromVersion: GitSemverTag, toVersion: GitSemverTag, platform: IGitPlatformPlugin, bumpManifest: BumpManifest, logger: LogReporter) {
    const logs = await workspace.project.git.logs(fromVersion.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, platform);
    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for changelog`);

    const changelogEntry = generateChangeLogEntry(commits, fromVersion, toVersion, platform);

    bumpManifest.add(workspace, toVersion.version, changelogEntry);

    await workspace.updateChangelog(toVersion.version, changelogEntry);
  }
}
