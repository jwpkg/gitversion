import { existsSync } from 'fs';
import { join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '../..';

export class PNpmPlugin implements IPlugin, IPackManager {
  name = 'NPM package manager plugin';
  ident = 'npm';

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

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string> {
    const result = await this.application.executor.exec(['pnpm', 'pack', '--pack-destination', outputFolder], {
      cwd: workspace.cwd,
    });

    if (result.length > 0) {
      return result;
    }
    throw new Error('Invalid npm output');
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
