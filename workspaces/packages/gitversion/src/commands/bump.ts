import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import * as t from 'typanion';

import { Application, IApplication } from '../core/application';
import { BumpManifest } from '../core/bump-manifest';
import { BumpType, detectBumpType, executeBump, validateBumpType } from '../core/bump-utils';
import { generateChangeLogEntry } from '../core/changelog';
import { parseConventionalCommits } from '../core/conventional-commmit-utils';
import { formatBumpType, formatPackageName } from '../core/format-utils';
import { Git } from '../core/git';
import { LogReporter, logger } from '../core/log-reporter';
import { GitSemverTag } from '../core/version-utils';
import { IWorkspace } from '../core/workspace-utils';

import { RestoreCommand } from './restore';

export class BumpCommand extends RestoreCommand {
  static paths = [
    ['bump'],
  ];

  version = Option.String('--version', {
    description: 'Bump with an explicit version',
  });

  bumpType: BumpType | undefined = Option.String('--bumpType', {
    description: 'Bump with an explicit version',
    validator: t.isEnum([BumpType.GRADUATE, BumpType.MAJOR, BumpType.MINOR, BumpType.PATCH]),
  });

  async execute(): Promise<number> {
    if ((await this.cli.run(['restore'])) !== 0) {
      return 1;
    }

    const application = await Application.init(await Git.root());
    const { project, git, configuration, pluginManager } = application;

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

    if (!this.version && configuration.options.independentVersioning === false) {
      this.version = await this.detectBumpForWorkspace(application, project, logger, bumpManifest, undefined, this.bumpType);
    }

    const promises = project.workspaces.map(async workspace => {
      return logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
        const newVersion = await this.detectBumpForWorkspace(application, workspace, logger, bumpManifest, this.version, this.bumpType);
        if (newVersion) {
          await workspace.updateVersion(newVersion, logger);
          await pluginManager.dispatchOnBump(application, workspace, newVersion);
        }
      });
    });

    await Promise.all(promises);
    await bumpManifest.persist();


    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(application: IApplication, workspace: IWorkspace, logger: LogReporter, bumpManifest: BumpManifest, explicitVersion?: string, explicitBumpType?: BumpType) {
    let newVersion: string | undefined;
    const workspaceForVersion = application.configuration.options.independentVersioning ? workspace : workspace.project;
    const currentVersion = await this.currentVersionFromGit(workspaceForVersion, application.git, application.branch);

    if (!explicitVersion) {
      const logs = await application.git.logs(currentVersion.hash, workspaceForVersion.relativeCwd);
      const commits = parseConventionalCommits(logs, application.pluginManager.gitPlatform);

      logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);

      const bumpType = explicitBumpType ?? validateBumpType(detectBumpType(commits), logs, application.configuration, application.branch);

      logger.reportInfo(`Bump type: ${formatBumpType(bumpType)}`);
      newVersion = executeBump(currentVersion.version, application.branch, bumpType) ?? undefined;
    } else {
      newVersion = explicitVersion;
    }

    if (newVersion) {
      await this.generateChangelogForWorkspace(application, workspace, currentVersion, {
        version: newVersion,
        hash: await application.git.currentCommit(),
      }, bumpManifest, logger);
    }
    return newVersion;
  }

  private async generateChangelogForWorkspace(application: IApplication, workspace: IWorkspace, fromVersion: GitSemverTag, toVersion: GitSemverTag, bumpManifest: BumpManifest, logger: LogReporter) {
    const logs = await application.git.logs(fromVersion.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, application.gitPlatform);
    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for changelog`);

    const changelogEntry = generateChangeLogEntry(commits, fromVersion, toVersion, application.pluginManager);

    bumpManifest.add(workspace, toVersion.version, changelogEntry, commits);

    await workspace.updateChangelog(toVersion.version, changelogEntry);
  }
}
