import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import * as t from 'typanion';

import { Application, IApplication } from '../core/application';
import { BumpManifest } from '../core/bump-manifest';
import { BumpType, detectBumpType, executeBump, validateBumpType } from '../core/bump-utils';
import { generateChangeLogEntry } from '../core/changelog';
import { parseConventionalCommits } from '../core/conventional-commmit-utils';
import { formatBumpType, formatPackageName } from '../core/format-utils';
import { LogReporter } from '../core/log-reporter';
import { GitSemverTag } from '../core/version-utils';
import { IWorkspace, updateWorkspaceVersion } from '../core/workspace-utils';

import { RestoreCommand } from './restore';

export class BumpCommand extends RestoreCommand {
  static paths = [
    ['bump'],
  ];

  version = Option.String('--version', {
    description: 'Bump with an explicit version',
  });

  bumpType: BumpType | undefined = Option.String('--bump-type', {
    description: 'Bump with an explicit version',
    validator: t.isEnum([BumpType.GRADUATE, BumpType.MAJOR, BumpType.MINOR, BumpType.PATCH]),
  });

  async execute(): Promise<number> {
    const application = await Application.init(this.context.application);
    const context = {
      ...this.context,
      application,
    };

    if ((await this.cli.run(['restore'], context)) !== 0) {
      return 1;
    }

    const { project, git, configuration, pluginManager, logger } = application;

    if (!project) {
      return 1;
    }

    const bump = logger.beginSection('Bump step');
    const isShallow = await git.exec('rev-parse', '--is-shallow-repository');
    if (isShallow === 'true') {
      logger.reportInfo('Fetching refs');
      await git.exec('fetch', '--all', '--tags', '--unshallow');
    }

    const bumpManifest = await BumpManifest.new(application);

    const projectBump = logger.beginSection('Bumping root workspace');
    const newVersion = await this.detectBumpForWorkspace(application, logger, project, bumpManifest, this.version, this.bumpType);
    if (newVersion) {
      await updateWorkspaceVersion(project, logger, newVersion);
      await pluginManager.dispatchOnBump(application, project, newVersion);
    }

    if (!this.version && configuration.options.independentVersioning === false) {
      this.version = newVersion;
    }

    logger.endSection(projectBump);

    const promises = project.childWorkspaces.map(async workspace => {
      return await logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
        const newVersion = await this.detectBumpForWorkspace(application, logger, workspace, bumpManifest, this.version, this.bumpType);
        if (newVersion) {
          await updateWorkspaceVersion(workspace, logger, newVersion);
          await pluginManager.dispatchOnBump(application, workspace, newVersion);
        }
      });
    });

    await Promise.all(promises);
    await bumpManifest.persist();


    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(application: IApplication, logger: LogReporter, workspace: IWorkspace, bumpManifest: BumpManifest, explicitVersion?: string, explicitBumpType?: BumpType) {
    let newVersion: string | undefined;
    const workspaceForVersion = application.configuration.options.independentVersioning ? workspace : workspace.project;
    const currentVersion = await this.currentVersionFromGit(workspaceForVersion, application.git, application.branch);

    if (!explicitVersion) {
      const logs = await application.git.logs(currentVersion.hash, workspaceForVersion.relativeCwd);
      const commits = parseConventionalCommits(logs, application.pluginManager.gitPlatform);

      logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);

      const bumpType = explicitBumpType ?? validateBumpType(detectBumpType(commits), logs, application.configuration, application.branch, application.logger);

      logger.reportInfo(`Bump type: ${formatBumpType(bumpType)}`);
      newVersion = executeBump(currentVersion.version, application.branch, bumpType) ?? undefined;
    } else {
      newVersion = explicitVersion;
    }

    if (newVersion) {
      await this.generateChangelogForWorkspace(application, logger, workspace, currentVersion, {
        version: newVersion,
        hash: await application.git.currentCommit(),
      }, bumpManifest);
    }
    return newVersion;
  }

  private async generateChangelogForWorkspace(application: IApplication, logger: LogReporter, workspace: IWorkspace, fromVersion: GitSemverTag, toVersion: GitSemverTag, bumpManifest: BumpManifest) {
    const logs = await application.git.logs(fromVersion.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, application.gitPlatform);
    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for changelog`);

    const changelogEntry = generateChangeLogEntry(commits, fromVersion, toVersion, application.pluginManager);

    bumpManifest.add(workspace, toVersion.version, changelogEntry, commits);

    await workspace.updateChangelog(changelogEntry);
  }
}
