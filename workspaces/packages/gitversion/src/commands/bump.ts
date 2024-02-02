import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import * as t from 'typanion';

import { BumpManifest } from '../core/bump-manifest';
import { BumpType, detectBumpType, executeBump, validateBumpType } from '../core/bump-utils';
import { generateChangeLogEntry } from '../core/changelog';
import { Configuration, IConfiguration } from '../core/configuration';
import { parseConventionalCommits } from '../core/conventional-commmit-utils';
import { formatBumpType, formatPackageName } from '../core/format-utils';
import { Git } from '../core/git';
import { LogReporter, logger } from '../core/log-reporter';
import { GitSemverTag } from '../core/version-utils';
import { IWorkspace } from '../core/workspace-utils';
import { IGitPlatform } from '../plugins/plugin';

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

    const { project, git, configuration } = await Configuration.load(await Git.root());
    if (!project) {
      return 1;
    }

    const bump = logger.beginSection('Bump step');
    const isShallow = await git.exec('rev-parse', '--is-shallow-repository');
    if (isShallow === 'true') {
      logger.reportInfo('Fetching refs');
      await git.exec('fetch', '--all', '--tags', '--unshallow');
    }

    const bumpManifest = await BumpManifest.new(configuration);

    if (!this.version && configuration.options.independentVersioning === false) {
      this.version = await this.detectBumpForWorkspace(project, configuration, logger, bumpManifest, undefined, this.bumpType);
    }

    const promises = project.workspaces.map(async workspace => {
      return logger.runSection(`Bumping package ${formatPackageName(workspace.packageName)}`, async logger => {
        const newVersion = await this.detectBumpForWorkspace(workspace, configuration, logger, bumpManifest, this.version, this.bumpType);
        if (newVersion) {
          await workspace.updateVersion(newVersion, logger);
          await configuration.pluginManager.dispatchOnBump(workspace, configuration, newVersion);
        }
      });
    });

    await Promise.all(promises);
    await bumpManifest.persist();


    logger.endSection(bump);
    return 0;
  }

  async detectBumpForWorkspace(workspace: IWorkspace, configuration: IConfiguration, logger: LogReporter, bumpManifest: BumpManifest, explicitVersion?: string, explicitBumpType?: BumpType) {
    let newVersion: string | undefined;
    const workspaceForVersion = configuration.options.independentVersioning ? workspace : workspace.project;
    const currentVersion = await this.currentVersionFromGit(workspaceForVersion, configuration);

    if (!explicitVersion) {
      const logs = await configuration.git.logs(currentVersion.hash, workspaceForVersion.relativeCwd);
      const commits = parseConventionalCommits(logs, configuration.pluginManager.gitPlatform);

      logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);

      const bumpType = explicitBumpType ?? validateBumpType(detectBumpType(commits), logs, configuration);

      logger.reportInfo(`Bump type: ${formatBumpType(bumpType)}`);
      newVersion = executeBump(currentVersion.version, configuration.branch, bumpType) ?? undefined;
    } else {
      newVersion = explicitVersion;
    }

    if (newVersion) {
      await this.generateChangelogForWorkspace(workspace, configuration, currentVersion, {
        version: newVersion,
        hash: await configuration.git.currentCommit(),
      }, configuration.pluginManager.gitPlatform, bumpManifest, logger);
    }
    return newVersion;
  }

  private async generateChangelogForWorkspace(workspace: IWorkspace, configuration: IConfiguration, fromVersion: GitSemverTag, toVersion: GitSemverTag, platform: IGitPlatform, bumpManifest: BumpManifest, logger: LogReporter) {
    const logs = await configuration.git.logs(fromVersion.hash, workspace.relativeCwd);
    const commits = parseConventionalCommits(logs, platform);
    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for changelog`);

    const changelogEntry = generateChangeLogEntry(commits, fromVersion, toVersion, configuration.pluginManager);

    bumpManifest.add(workspace, toVersion.version, changelogEntry, commits);

    await workspace.updateChangelog(toVersion.version, changelogEntry);
  }
}
