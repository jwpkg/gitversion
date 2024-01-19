import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { dirname, join } from 'path';

import { BranchType, VersionBranch } from '../config';
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

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    const packManifest = await PackArtifact.load(project);

    const packedWorkspaces = packManifest.manifest.packages;
    if (packedWorkspaces.length > 0) {
      const promises = packedWorkspaces.map(async packedPackage => {
        await this.publishPackage(packedPackage, join(packManifest.packFolder, packedPackage.packFile), project.config.branch);
      });
      await Promise.all(promises);
    } else {
      logger.reportWarning('Nothing to tag');
    }

    await this.cli.run(['tag', '--push', `${this.push}`]);

    return 0;
  }

  async publishPackage(packedPackage: PackedPackage, packFile: string, branch: VersionBranch) {
    return logger.runSection(`Publishing ${formatPackageName(packedPackage.packageName)}`, async logger => {
      const tag = branch.type === BranchType.MAIN ? 'latest' : branch.name;
      logger.reportInfo(['npm', 'publish', packFile, '--tag', tag].join(' '));

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
    });
  }
}
