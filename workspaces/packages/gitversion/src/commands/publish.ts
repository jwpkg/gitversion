import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { dirname, join } from 'path';

import { BranchType, VersionBranch } from '../utils/config';
import { formatPackageName } from '../utils/format-utils';
import { Git, gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { PackArtifact, PackedPackage } from '../utils/pack-artifact';
import { Project } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class PublishCommand extends GitVersionCommand {
  static paths = [
    ['publish'],
  ];

  push = Option.Boolean('--push', true);
  dryRun = Option.Boolean('--dry-run', true);

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    let packManifest = await PackArtifact.load(project);

    if (!packManifest) {
      logger.reportInfo('No pack manifest found. Running pack on current workspace');
      const result = await this.cli.run(['pack']);
      if (result !== 0) {
        return result;
      }
      packManifest = await PackArtifact.load(project);
    } else {
      logger.reportInfo('Pack manifest found. Publishing from pack');
    }

    if (packManifest === null) {
      logger.reportError('Still invalid pack manifest. Breaking off');
      return 1;
    }


    const packedPackages = packManifest.manifest.packages;
    if (packedPackages.length > 0) {
      await this.publishPackages(packedPackages, project.config.branch);
      await this.addTags(packedPackages, project.git);
      await this.updateChangelogs(packedPackages, project);

      if (this.push) {
        if (this.dryRun) {
          logger.reportInfo('[Dry run] Would be pushing back to git');
        } else {
          logger.reportInfo('Pushing back to git');
          await project.git.push();
        }
      } else {
        logger.reportInfo('Skipping push step');
      }
    } else {
      logger.reportWarning('Nothing to publish');
    }

    return 0;
  }

  async publishPackages(packedPackages: PackedPackage[], branch: VersionBranch) {
    const publish = logger.beginSection('Publish step');
    const promises = packedPackages.map(async packedPackage => {
      if (packedPackage.packFile) {
        await this.publishPackage(packedPackage, packedPackage.packFile, branch);
      }
    });

    await Promise.all(promises);
    logger.endSection(publish);
  }

  async publishPackage(packedPackage: PackedPackage, packFile: string, branch: VersionBranch) {
    return logger.runSection(`Publishing ${formatPackageName(packedPackage.packageName)}`, async logger => {
      const tag = branch.type === BranchType.MAIN ? 'latest' : branch.name;
      logger.reportInfo([colorize.whiteBright('»'), 'npm', 'publish', packFile, '--tag', tag].join(' '));

      if (this.dryRun) {
        logger.reportWarning('Dry run active. Only simulating publish');
      } else {
        const output = await crossSpawnAsync('npm', ['publish', packFile, '--tag', tag, '--access', 'public', '--verbose'], {
          cwd: dirname(packFile),
          env: process.env,
        });

        if (output.error) {
          if (output.error?.message) {
            logger.reportError(`${output.error.message}`);
          } else {
            logger.reportError(`${output.error}`);
          }
          logger.reportError(`Error during publish. Exit code: ${colorize.redBright(output.exitCode)}`);
        } else if (output.exitCode !== 0) {
          logger.reportInfo(`Publish error: ${output.exitCode}`);
        } else {
          logger.reportInfo('Publish package success');
        }
      }
    });
  }

  async addTags(packages: PackedPackage[], git: Git) {
    const section = logger.beginSection('Tagging step');

    const allTags = packages.map(p => p.tag);
    const tags = allTags.filter((tag, pos) => {
      return allTags.indexOf(tag) == pos;
    });

    const commands = tags.map(async tag => {
      if (this.dryRun) {
        logger.reportInfo(`[DryRun] Would add tag ${tag}`);
      } else {
        logger.reportInfo(`Adding tag: ${tag}`);
        await git.addTag(tag);
      }
    });
    await Promise.all(commands);
    logger.endSection(section);
  }

  async updateChangelogs(packages: PackedPackage[], project: Project) {
    const section = logger.beginSection('Updating changelogs');

    const files: string[] = [];
    const commands = packages.map(async p => {
      const workspace = project.workspaces.find(w => w.relativeCwd === p.packageRelativeCwd);
      if (workspace) {
        logger.reportInfo(`Updating: ${colorize.yellow(colorize.underline(join(workspace.cwd, 'CHANGELOG.md')))}`);
        await workspace.updateChangelog(p.version, p.changeLog);
      }
    });
    await Promise.all(commands);

    if (files.length > 0) {
      if (this.dryRun) {
        logger.reportInfo('[Dry run] Would be committing changelogs to git');
      } else {
        logger.reportInfo('Committing changelogs to git');
        await project.git.addAndCommitFiles('Updated changelogs', files);
      }
    }

    logger.endSection(section);
  }
}
