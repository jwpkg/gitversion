import { Option } from 'clipanion';

import { Application } from '../core/application';
import { Git } from '../core/git';
import { LogReporter } from '../core/log-reporter';
import { PackArtifact, PackedPackage } from '../core/pack-artifact';

import { GitVersionCommand } from './context';

export class TagCommand extends GitVersionCommand {
  static paths = [
    ['tag'],
  ];

  push = Option.Boolean('--push', true, { description: 'Push the tags to the remote repository' });
  force = Option.Boolean('--force', false, { description: 'Force tagging ignore git status' });
  dryRun = Option.Boolean('--dry-run', false);

  async execute(): Promise<number> {
    const application = await Application.init(this.context.application, {
      dryRun: this.dryRun,
    });

    const context = {
      ...this.context,
      application,
    };

    const { project, git, configuration, logger } = application;

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

    if (!(await packManifest.validateGitStatusForPublish()) && !this.force) {
      logger.reportWarning('Git status has changed since pack. Please make sure you have a valid flow', true);
      console.log('Git status output:');
      console.log(await git.exec('status', '--porcelain'));
    }

    const packedPackages = packManifest.packages;
    if (packedPackages.length > 0) {
      await this.addTags(packedPackages, git, logger);

      if (this.push) {
        await git.push();
      } else {
        logger.reportInfo('Skipping push step');
      }
    } else {
      logger.reportWarning('Nothing to tag');
    }

    return 0;
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
}
