import { existsSync } from 'fs';
import { join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackageManager, IPlugin, IPluginInitialize } from '../..';

export class YarnPlugin implements IPlugin, IPackageManager {
  name = 'Yarn package manager plugin';

  get packageManager() {
    return this;
  }

  private constructor(private application: IPluginInitialize) { }

  static initialize(initialize: IPluginInitialize) {
    if (existsSync(join(initialize.cwd, 'yarn.lock'))) {
      return new YarnPlugin(initialize);
    }
    return null;
  }

  async pack(workspace: IWorkspace, output: string) {
    await this.application.executor.exec(['yarn', 'pack', '-o', output], {
      cwd: workspace.cwd,
    });
  }

  async publish(packedPackage: PackedPackage, releaseTag: string): Promise<void> {
    if (packedPackage.packFile) {
      const fileLocation = join(this.application.packFolder, packedPackage.packFile);
      if (this.application.options.dryRun) {
        this.application.logger.reportInfo(`[DRY-RUN] Would be publishing ${packedPackage.packageName} using release tag ${releaseTag}`);
        return;
      } else {
        await this.application.executor.exec(['npm', 'publish', fileLocation, '--tag', releaseTag, '--access', 'public', '--verbose'], {
          cwd: this.application.packFolder,
        });
      }
    }
  }
}
