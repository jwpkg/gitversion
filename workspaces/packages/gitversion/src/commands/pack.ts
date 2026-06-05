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
import { topoSort } from '../core/topo-sort';
import { IWorkspace } from '../core/workspace-utils';

import { GitVersionCommand } from './context';

export class PackCommand extends GitVersionCommand {
  static paths = [
    ['pack'],
  ];

  maxConcurrency = Option.String('-m,--max-concurrency', {
    validator: cascade(isNumber(), isAtLeast(1)),
  });

  republish = Option.Boolean('--republish', false, { description: 'Also pack workspaces with no version bump at their current version, republishing them' });

  async execute(): Promise<number> {
    const application = await Application.init(this.context.application);

    const { project, git, configuration, logger } = application;
    if (!project) {
      return 1;
    }

    const section = logger.beginSection('Pack step');

    const bumpManifest = await BumpManifest.load(application);
    if (!bumpManifest && !this.republish) {
      logger.reportError('No valid bump file found. Please run bump first');
      return 1;
    }

    const gitStatus = bumpManifest?.gitStatus ?? (() => {
      // No bump manifest: synthetic status where all hashes are the current hash.
      // gitStatusHash() is called again inside PackArtifact.new() for prePack, so we
      // just need a placeholder here; we'll re-read it synchronously below.
      return null;
    })();

    let resolvedGitStatus: { preBump: string, postBump: string };
    if (gitStatus) {
      resolvedGitStatus = gitStatus;
    } else {
      const currentHash = await git.gitStatusHash();
      resolvedGitStatus = { preBump: currentHash, postBump: currentHash };
    }

    const packManifest = await PackArtifact.new(configuration, git, resolvedGitStatus, this.republish);

    let hasErrors = false;
    let hasSomethingToPack = false;

    // --- Bumped workspaces (normal flow) ---
    if (bumpManifest && bumpManifest.bumps.length > 0) {
      if (!packManifest.validateGitStatusWithBump()) {
        logger.reportWarning(`Git status has changed between ${colorize.blue('gitversion bump')} and ${colorize.blue('gitversion pack')}. This could be an error`, true);
      }

      hasSomethingToPack = true;

      const projectBump = bumpManifest.bumps.find(b => b.packageRelativeCwd === '.');
      if (projectBump && project.childWorkspaces.length > 0) {
        packManifest.add(projectBump);
      }

      const packFolder = join(configuration.stagingFolder, 'pack');
      await mkdir(packFolder, { recursive: true });

      // Phase 1: write all versions to disk in parallel so every package.json is
      // up-to-date before any pack subprocess reads them.
      await Promise.all(bumpManifest.bumps.map(async bump => {
        const workspace = project.workspaces.find(w => w.relativeCwd === bump.packageRelativeCwd);
        if (workspace) {
          try {
            await workspace.updateVersion(bump.version);
            await workspace.updateChangelog(bump.changeLog);
          } catch (error) {
            hasErrors = true;
            throw error;
          }
        }
      }));

      // Phase 2: pack in topological dependency order, parallel within each level.
      // The root workspace (when it has children) is registered in packManifest above but not packed.
      const workspacesToPack = bumpManifest.bumps
        .filter(b => !(b.packageRelativeCwd === '.' && project.childWorkspaces.length > 0))
        .map(b => project.workspaces.find(w => w.relativeCwd === b.packageRelativeCwd))
        .filter((w): w is IWorkspace => !!w);

      for (const level of topoSort(workspacesToPack)) {
        const queue = new Queue({
          concurrent: this.maxConcurrency ?? cpus().length,
          start: false,
        });
        level.forEach(workspace => {
          const bump = bumpManifest.bumps.find(b => b.packageRelativeCwd === workspace.relativeCwd)!;
          queue.enqueue(async () => {
            try {
              await this.execPackCommand(application, workspace, bump, packManifest, false);
            } catch (error) {
              hasErrors = true;
              throw error;
            }
          });
        });
        while (queue.shouldRun) {
          await queue.dequeue();
        }
      }
    }

    // --- Republish workspaces (workspaces not covered by the bump manifest) ---
    if (this.republish) {
      const bumpedCwds = new Set(bumpManifest?.bumps.map(b => b.packageRelativeCwd) ?? []);
      const republishWorkspaces = project.workspaces.filter(w => !w.private && !bumpedCwds.has(w.relativeCwd));

      if (republishWorkspaces.length > 0) {
        hasSomethingToPack = true;

        const packFolder = join(configuration.stagingFolder, 'pack');
        await mkdir(packFolder, { recursive: true });

        for (const level of topoSort(republishWorkspaces)) {
          const queue = new Queue({
            concurrent: this.maxConcurrency ?? cpus().length,
            start: false,
          });
          level.forEach(workspace => {
            queue.enqueue(async () => {
              try {
                const syntheticBump: Bump = {
                  packageRelativeCwd: workspace.relativeCwd,
                  packageName: workspace.packageName,
                  version: workspace.version,
                  previousVersion: workspace.version,
                  tag: workspace.tagPrefix + workspace.version,
                  private: false,
                  commits: [],
                  changeLog: { version: workspace.version, headerLine: '', body: '' },
                };
                await this.execPackCommand(application, workspace, syntheticBump, packManifest, true);
              } catch (error) {
                hasErrors = true;
                throw error;
              }
            });
          });
          while (queue.shouldRun) {
            await queue.dequeue();
          }
        }
      }
    }

    if (!hasSomethingToPack) {
      logger.reportWarning('Nothing to pack');
    }

    if (hasErrors) {
      logger.reportError('Errors occurred during packing process', true);
      return 1;
    }

    await packManifest.persist();

    if (!packManifest.validateGitStatusDuringPack()) {
      logger.reportWarning(`Git status has changed during ${colorize.blue('gitversion pack')} you should make sure your build artifacts (including gitversion.out) are correctly ignored in .gitignore`, true);
    }

    logger.endSection(section);

    return 0;
  }

  async execPackCommand(application: IApplication, workspace: IWorkspace, bump: Bump, packManifest: PackArtifact, republish = false) {
    return application.logger.runSection(`Packing ${formatPackageName(bump.packageName)}`, async logger => {
      try {
        const packCommands = application.packManagers.map(async packManager => {
          const folder = join(application.configuration.packFolder, packManager.ident);
          await mkdir(folder, {
            recursive: true,
          });
          const packFile = await packManager.pack(workspace, folder);
          if (packFile) {
            if (Array.isArray(packFile)) {
              for (const file of packFile) {
                const fullName = join(folder, file);
                const stats = await stat(fullName);
                logger.reportInfo(`Generated package: ./${relative(application.cwd, fullName)} (${formatFileSize(stats.size)})`);
              }
              return {
                [packManager.ident]: packFile,
              };
            } if (typeof packFile === 'string') {
              const fullName = join(folder, packFile);
              const stats = await stat(fullName);
              logger.reportInfo(`Generated package: ./${relative(application.cwd, fullName)} (${formatFileSize(stats.size)})`);
              return {
                [packManager.ident]: packFile,
              };
            } else if (typeof packFile === 'object' && packFile !== null) {
              // If packFile is an object, we assume it's a record of files
              const files: Record<string, string> = {};
              for (const [key, value] of Object.entries(packFile)) {
                const fullName = join(folder, value);
                const stats = await stat(fullName);
                logger.reportInfo(`Generated package: ./${relative(application.cwd, fullName)} (${formatFileSize(stats.size)})`);
                files[key] = value;
              }
              return {
                [packManager.ident]: files,
              };
            } else {
              return {};
            }
          } else {
            return {};
          }
        });

        const files = (await Promise.all(packCommands)).reduce((p: Record<string, string | string[] | Record<string, string>>, c) => {
          return {
            ...p,
            ...c,
          };
        }, {});

        packManifest.add({
          packFiles: files,
          ...bump,
          republish: republish || undefined,
        });
      } catch (error) {
        logger.reportError(`Error during pack: ${colorize.redBright(`${error}`)}`);
        throw error;
      }
    });
  }
}
