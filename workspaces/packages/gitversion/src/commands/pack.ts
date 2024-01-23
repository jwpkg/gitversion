import { colorize } from 'colorize-node';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { mkdir, stat } from 'fs/promises';
import { join } from 'path';

import { Bump, BumpManifest } from '../utils/bump-manifest';
import { formatFileSize, formatPackageName } from '../utils/format-utils';
import { gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { PackArtifact } from '../utils/pack-artifact';
import { Project } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class PackCommand extends GitVersionCommand {
  static paths = [
    ['pack'],
  ];

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    const section = logger.beginSection('Pack step');

    const bumpManifest = await BumpManifest.load(project);
    const packManifest = await PackArtifact.new(project);

    const bumpedWorkspaces = bumpManifest.manifest.bumps.filter(b => b.private === false);
    if (bumpedWorkspaces.length > 0) {
      const packFolder = join(project.stagingFolder, 'pack');
      await mkdir(packFolder, {
        recursive: true,
      });

      const promises = bumpedWorkspaces.map(async bump => {
        return this.execPackCommand(join(project.cwd, bump.packageRelativeCwd), packFolder, bump, packManifest);
      });
      await Promise.all(promises);
      await packManifest.persist();
    } else {
      logger.reportWarning('Nothing to pack');
    }

    logger.endSection(section);

    await this.cli.run(['reset']);

    return 0;
  }

  async execPackCommand(cwd: string, packFolder: string, bump: Bump, packManifest: PackArtifact) {
    const normalizedPackageName = `${bump.packageName.replace(/@/g, '').replace(/\//g, '-')}-${bump.version}.tgz`;
    const packFile = `${join(packFolder, normalizedPackageName)}`;

    return logger.runSection(`Packing ${formatPackageName(bump.packageName)}`, async logger => {
      const output = await crossSpawnAsync('yarn', ['pack', '-o', packFile], {
        cwd,
      });

      if (output.error) {
        if (output.error?.message) {
          logger.reportError(`${output.error.message}`);
        } else {
          logger.reportError(`${output.error}`);
        }
        logger.reportError(`Error during pack. Exit code: ${colorize.redBright(output.exitCode)}`);
      } else {
        const stats = await stat(packFile);
        logger.reportInfo(`Generated package: ${packFile}`);
        logger.reportInfo(`Generated package size: ${formatFileSize(stats.size)}`);
      }
      packManifest.add({
        packFile: normalizedPackageName,
        ...bump,
      });
    });
  }
}
