import { existsSync } from 'fs';
import { join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '../..';

export class YarnBerryPlugin implements IPlugin, IPackManager {
  name = 'Yarn berry package manager plugin';
  ident = 'yarn-berry';

  get packManager() {
    return this;
  }

  private constructor(private application: IPluginInitialize) { }

  static initialize(initialize: IPluginInitialize) {
    if (existsSync(join(initialize.cwd, 'yarn.lock'))) {
      return new YarnBerryPlugin(initialize);
    }
    return null;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string> {
    const normalizedPackageName = `${workspace.packageName.replace(/@/g, '').replace(/\//g, '-')}-${workspace.version}.tgz`;
    const outFile = join(outputFolder, normalizedPackageName);

    await this.application.executor.exec(['yarn', 'pack', '-o', outFile], {
      cwd: workspace.cwd,
    });
    return normalizedPackageName;
  }

  async publish(_packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean): Promise<void> {
    if (dryRun) {
      this.application.logger.reportDryrun(`Would be publishing ${fileName} using release tag ${releaseTag}`);
      return;
    } else {
      await this.application.executor.exec(['npm', 'publish', fileName, '--tag', releaseTag, '--access', 'public', '--verbose'], {
        cwd: this.application.packFolder,
      });
    }
  }
}
