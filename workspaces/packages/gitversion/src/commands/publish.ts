import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import { join } from 'path';

import { Application } from '../core/application';
import { BranchType, IConfiguration, VersionBranch } from '../core/configuration';
import { formatPackageName } from '../core/format-utils';
import { Git } from '../core/git';
import { LogReporter } from '../core/log-reporter';
import { PackArtifact, PackedPackage } from '../core/pack-artifact';
import { IProject } from '../core/workspace-utils';
import { IPackManager } from '../plugins';

import { GitVersionCommand } from './context';

export class PublishCommand extends GitVersionCommand {
  static paths = [
    ['publish'],
  ];

  push = Option.Boolean('--push', true);
  dryRun = Option.Boolean('--dry-run', false);

  async execute(): Promise<number> {
    const application = await Application.init(this.context.application, {
      dryRun: this.dryRun,
    });

    const context = {
      ...this.context,
      application,
    };

    const { project, git, configuration, branch, hooks, packManagers, logger } = application;

    if (!project) {
      return 1;
    }

    let packManifest = await PackArtifact.load(configuration, git);

    if (!packManifest) {
      logger.reportInfo('No pack manifest found. Running pack on current workspace');
      const result = await this.cli.run(['pack'], context);
      if (result !== 0) {
        return result;
      }
      packManifest = await PackArtifact.load(configuration, git);
    } else {
      logger.reportInfo('Pack manifest found. Publishing from pack');
    }

    if (packManifest === null) {
      logger.reportError('Still invalid pack manifest. Breaking off');
      return 1;
    }

    if (!(await packManifest.validateGitStatusForPublish())) {
      // TODO: Reference to a correct help page to fix this
      logger.reportError('Git status has changed since pack. Please make sure you have a valid flow', true);
      console.log(await git.exec('status'));
      return 1;
    }

    const packedPackages = packManifest.packages;
    if (packedPackages.length > 0) {
      await this.publishPackages(packManagers, packedPackages, configuration, branch, logger);
      await this.addTags(packedPackages, git, logger);

      if (this.push) {
        await git.push();
      } else {
        logger.reportInfo('Skipping push step');
      }

      await this.updateChangelogs(packedPackages, project, git, logger);
      if (this.push) {
        await git.push();
      } else {
        logger.reportInfo('Skipping push step');
      }

      await hooks.dispatchOnPublish(application, packedPackages);
    } else {
      logger.reportWarning('Nothing to publish');
    }

    return 0;
  }

  async publishPackages(packManagers: IPackManager[], packedPackages: PackedPackage[], configuration: IConfiguration, branch: VersionBranch, logger: LogReporter) {
    const publish = logger.beginSection('Publish step');
    const promises = packedPackages.map(async packedPackage => {
      if (packedPackage.packFiles) {
        await this.publishPackage(packManagers, packedPackage, configuration, branch, logger);
      }
    });

    await Promise.all(promises);
    logger.endSection(publish);
  }

  async publishPackage(packManagers: IPackManager[], packedPackage: PackedPackage, configuration: IConfiguration, branch: VersionBranch, logger: LogReporter) {
    return logger.runSection(`Publishing ${formatPackageName(packedPackage.packageName)}`, async () => {
      const releaseTag = branch.type === BranchType.MAIN ? 'latest' : branch.name;
      const publishCommands = packManagers.map(async packManager => {
        if (packedPackage.packFiles?.[packManager.ident]) {
          await packManager.publish(packedPackage, join(configuration.packFolder, packManager.ident, packedPackage.packFiles[packManager.ident]), releaseTag, this.dryRun);
        }
      });

      await Promise.all(publishCommands);
    });
  }

  async addTags(packages: PackedPackage[], git: Git, logger: LogReporter) {
    const section = logger.beginSection('Tagging step');

    const allTags = packages.map(p => p.tag);
    const tags = allTags.filter((tag, pos) => {
      return allTags.indexOf(tag) == pos;
    });

    const commands = tags.map(async tag => {
      await git.addTag(tag, 'Tag added by gitversion');
    });
    await Promise.all(commands);
    logger.endSection(section);
  }

  async updateChangelogs(packages: PackedPackage[], project: IProject, git: Git, logger: LogReporter) {
    const section = logger.beginSection('Updating changelogs');

    const files: string[] = [];
    const commands = packages.map(async p => {
      const workspace = project.workspaces.find(w => w.relativeCwd === p.packageRelativeCwd);
      if (workspace) {
        const file = await workspace.updateChangelog(p.changeLog);
        if (!files.includes(file)) {
          logger.reportInfo(`Updating: ${colorize.yellow(colorize.underline(join(workspace.cwd, 'CHANGELOG.md')))}`);
          files.push(file);
        }
      }
    });
    await Promise.all(commands);

    if (files.length > 0) {
      await git.addAndCommitFiles('Updated changelogs', files);
    }

    logger.endSection(section);
  }
}
