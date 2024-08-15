import { existsSync } from 'fs';
import { basename, join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '../..';

export class PNpmPlugin implements IPlugin, IPackManager {
  name = 'PNPM package manager plugin';
  ident = 'pnpm';

  get packManager() {
    return this;
  }

  private constructor(private application: IPluginInitialize) { }

  static initialize(initialize: IPluginInitialize) {
    if (existsSync(join(initialize.cwd, 'pnpm-lock.yaml'))) {
      return new PNpmPlugin(initialize);
    }
    return null;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string | null> {
    if (workspace.private) {
      return null;
    }

    const result = await this.application.executor.exec(['pnpm', 'pack', '--pack-destination', outputFolder], {
      cwd: workspace.cwd,
    });

    const filename = basename(result);

    if (filename.length > 0) {
      return filename;
    }
    throw new Error('Invalid pnpm output');
  }

  async publish(packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean): Promise<void> {
    if (dryRun) {
      this.application.logger.reportDryrun(`Would be publishing ${packedPackage.packageName} using release tag ${releaseTag}`);
      return;
    } else {
      await this.application.executor.exec(['pnpm', 'publish', fileName, '--tag', releaseTag, '--access', 'public', '--verbose'], {
        cwd: this.application.packFolder,
      });
    }
  }
}
