import { colorize } from 'colorize-node';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { mkdir, stat } from 'fs/promises';
import { join } from 'path';

import { Bump, BumpManifest } from '../core/bump-manifest';
import { Configuration } from '../core/configuration';
import { formatFileSize, formatPackageName } from '../core/format-utils';
import { Git } from '../core/git';
import { logger } from '../core/log-reporter';
import { PackArtifact } from '../core/pack-artifact';

import { GitVersionCommand } from './context';

export class PackCommand extends GitVersionCommand {
  static paths = [
    ['pack'],
  ];

  async execute(): Promise<number> {
    const { project, git, configuration } = await Configuration.load(await Git.root());
    if (!project) {
      return 1;
    }

    const section = logger.beginSection('Pack step');

    const bumpManifest = await BumpManifest.load(project);
    if (!bumpManifest) {
      logger.reportError('No valid bump file found. Please run bump first');
      return 1;
    }
    const packManifest = await PackArtifact.new(project, bumpManifest.gitStatus);

    if (!packManifest.validateGitStatusWithBump()) {
      logger.reportWarning(`Git status has changed between ${colorize.blue('gitversion bump')} and ${colorize.blue('gitversion pack')}. This could be an error`, true);
      console.log(await git.exec('status'));
    }

    const bumpedWorkspaces = bumpManifest.bumps.filter(b => b.private === false);
    if (bumpedWorkspaces.length > 0) {
      const projectBump = bumpManifest.bumps.find(b => b.packageRelativeCwd === '.');
      if (projectBump) {
        packManifest.add(projectBump);
      }

      const packFolder = join(configuration.stagingFolder, 'pack');
      await mkdir(packFolder, {
        recursive: true,
      });

      const promises = bumpedWorkspaces.map(async bump => {
        const workspace = project.workspaces.find(w => w.relativeCwd === bump.packageRelativeCwd);
        if (workspace) {
          await workspace.updateVersion(bump.version, logger);
          await workspace.updateChangelog(bump.version, bump.changeLog);
        }

        await this.execPackCommand(join(project.cwd, bump.packageRelativeCwd), packFolder, bump, packManifest);
      });
      await Promise.all(promises);
    } else {
      logger.reportWarning('Nothing to pack');
    }

    await packManifest.persist();

    if (!packManifest.validateGitStatusDuringPack()) {
      logger.reportWarning(`Git status has changed during ${colorize.blue('gitversion pack')} you should make sure your build artifacts (including gitversion.out) are correctly ignored in .gitignore`, true);
      console.log(await git.exec('status'));
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
