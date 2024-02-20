import { Option } from 'clipanion';
import { colorize } from 'colorize-node';
import { mkdir, stat } from 'fs/promises';
import { cpus } from 'os';
import { join, relative } from 'path';
import Queue from 'queue-promise';
import { cascade, isAtLeast, isNumber } from 'typanion';

import { Application, IApplication } from '../core/application';
import { Bump, BumpManifest } from '../core/bump-manifest';
import { formatFileSize, formatPackageName } from '../core/format-utils';
import { PackArtifact } from '../core/pack-artifact';
import { IWorkspace } from '../core/workspace-utils';

import { GitVersionCommand } from './context';

export class PackCommand extends GitVersionCommand {
  static paths = [
    ['pack'],
  ];

  maxConcurrency = Option.String('-m,--max-concurrency', {
    validator: cascade(isNumber(), isAtLeast(1)),
  });

  async execute(): Promise<number> {
    const application = await Application.init(this.context.application);

    const { project, git, configuration, logger } = application;
    if (!project) {
      return 1;
    }

    const section = logger.beginSection('Pack step');

    const bumpManifest = await BumpManifest.load(application);
    if (!bumpManifest) {
      logger.reportError('No valid bump file found. Please run bump first');
      return 1;
    }
    const packManifest = await PackArtifact.new(configuration, git, bumpManifest.gitStatus);

    if (!packManifest.validateGitStatusWithBump()) {
      logger.reportWarning(`Git status has changed between ${colorize.blue('gitversion bump')} and ${colorize.blue('gitversion pack')}. This could be an error`, true);
    }

    if (bumpManifest.bumps.length > 0) {
      const projectBump = bumpManifest.bumps.find(b => b.packageRelativeCwd === '.');
      if (projectBump) {
        packManifest.add(projectBump);
      }

      const packFolder = join(configuration.stagingFolder, 'pack');
      await mkdir(packFolder, {
        recursive: true,
      });

      const queue = new Queue({
        concurrent: this.maxConcurrency ?? cpus().length,
        start: false,
      });

      bumpManifest.bumps.forEach(bump => {
        queue.enqueue(async () => {
          const workspace = project.workspaces.find(w => w.relativeCwd === bump.packageRelativeCwd);
          if (workspace) {
            await workspace.updateVersion(bump.version);
            await workspace.updateChangelog(bump.changeLog);
            await this.execPackCommand(application, workspace, bump, packManifest);
          }
        });
      });

      while (queue.shouldRun) {
        await queue.dequeue();
      }
    } else {
      logger.reportWarning('Nothing to pack');
    }

    await packManifest.persist();

    if (!packManifest.validateGitStatusDuringPack()) {
      logger.reportWarning(`Git status has changed during ${colorize.blue('gitversion pack')} you should make sure your build artifacts (including gitversion.out) are correctly ignored in .gitignore`, true);
    }

    logger.endSection(section);

    return 0;
  }

  async execPackCommand(application: IApplication, workspace: IWorkspace, bump: Bump, packManifest: PackArtifact) {
    return application.logger.runSection(`Packing ${formatPackageName(bump.packageName)}`, async logger => {
      try {
        const packCommands = application.packManagers.map(async packManager => {
          const folder = join(application.configuration.packFolder, packManager.ident);
          await mkdir(folder, {
            recursive: true,
          });
          const packFile = await packManager.pack(workspace, folder);
          if (packFile) {
            const fullName = join(folder, packFile);
            const stats = await stat(fullName);
            logger.reportInfo(`Generated package: ./${relative(application.cwd, fullName)} (${formatFileSize(stats.size)})`);
            return {
              [packManager.ident]: packFile,
            };
          } else {
            return {};
          }
        });

        const files = (await Promise.all(packCommands)).reduce((p, c) => {
          return {
            ...p,
            ...c,
          };
        }, {});

        packManifest.add({
          packFiles: files,
          ...bump,
        });
      } catch (error) {
        logger.reportError(`Error during pack: ${colorize.redBright(`${error}`)}`);
      }
    });
  }
}
