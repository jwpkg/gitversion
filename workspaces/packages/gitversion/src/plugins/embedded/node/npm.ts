import { cp, mkdtemp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '../..';

export class NpmPlugin implements IPlugin, IPackManager {
  name = 'NPM package manager plugin';
  ident = 'npm';

  get packManager() {
    return this;
  }

  private constructor(private application: IPluginInitialize) { }

  static initialize(initialize: IPluginInitialize) {
    if (existsSync(join(initialize.cwd, 'package-lock.json'))) {
      return new NpmPlugin(initialize);
    }
    return null;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string | null> {
    if (workspace.private) {
      return null;
    }

    let tmpDir: string | undefined;
    try {
      tmpDir = await mkdtemp(join(tmpdir(), 'gitversion-npm'));
      const result = await this.application.executor.exec(['npm', 'pack', '--pack-destination', tmpDir, '--json'], {
        cwd: workspace.cwd,
      });

      const files = JSON.parse(result);
      if (files.length == 1) {
        if (files[0].filename) {
          const outfile = join(tmpDir, files[0].filename);
          if (existsSync(join(outfile))) {
            await cp(outfile, join(outputFolder, files[0].filename));
            return files[0].filename;
          }
        }
      }
      throw new Error('Invalid npm output');
    } finally {
      try {
        if (tmpDir) {
          await rm(tmpDir, { recursive: true });
        }
      } catch (_e) {
      }
    }
  }

  async publish(packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean): Promise<void> {
    if (dryRun) {
      this.application.logger.reportDryrun(`Would be publishing ${packedPackage.packageName} using release tag ${releaseTag}`);
      return;
    } else {
      await this.application.executor.exec(['npm', 'publish', fileName, '--tag', releaseTag, '--access', 'public', '--verbose'], {
        cwd: this.application.packFolder,
      });
    }
  }
}
