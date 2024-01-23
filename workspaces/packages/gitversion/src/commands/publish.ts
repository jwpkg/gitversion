import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { dirname, join } from 'path';

import { BranchType, VersionBranch } from '../utils/config';
import { formatPackageName } from '../utils/format-utils';
import { gitRoot } from '../utils/git';
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


    const publish = logger.beginSection('Publish step');

    const packedWorkspaces = packManifest.manifest.packages;
    if (packedWorkspaces.length > 0) {
      const promises = packedWorkspaces.map(async packedPackage => {
        await this.publishPackage(packedPackage, join(packManifest!.packFolder, packedPackage.packFile), project.config.branch);
      });
      await Promise.all(promises);
    } else {
      logger.reportWarning('Nothing to tag');
    }

    logger.endSection(publish);

    if (this.dryRun) {
      logger.reportWarning('Dry run active. Would tag now');
    } else {
      await this.cli.run(['tag', '--push', `${this.push}`]);
    }
    return 0;
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
}
