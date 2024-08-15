import { getPluginConfiguration } from '@yarnpkg/cli';
import { Project as YarnProject, Configuration as YarnConfiguration } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import { npmConfigUtils, npmHttpUtils, npmPublishUtils } from '@yarnpkg/plugin-npm';
import { readFile } from 'fs/promises';
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

  private constructor(private application: IPluginInitialize, private yarnProject: YarnProject, private yarnConfiguration: YarnConfiguration) { }

  static async initialize(initialize: IPluginInitialize) {
    if (existsSync(join(initialize.cwd, 'yarn.lock'))) {
      const yarnConfig = await YarnConfiguration.find(npath.toPortablePath(initialize.cwd), getPluginConfiguration());

      const { project } = await YarnProject.find(yarnConfig, npath.toPortablePath(initialize.cwd));
      return new YarnBerryPlugin(initialize, project, yarnConfig);
    }
    return null;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string | null> {
    if (workspace.private) {
      return null;
    }

    const normalizedPackageName = `${workspace.packageName.replace(/@/g, '').replace(/\//g, '-')}-${workspace.version}.tgz`;
    const outFile = join(outputFolder, normalizedPackageName);

    await this.application.executor.exec(['yarn', 'pack', '-o', outFile], {
      cwd: workspace.cwd,
    });
    return normalizedPackageName;
  }

  async publish(packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean): Promise<void> {
    const yarnWorkspace = this.yarnProject.workspaces.find(w => w.relativeCwd === packedPackage.packageRelativeCwd);
    if (!yarnWorkspace) {
      throw new Error('Mismatch between yarn workspace and gitversion workspace. Please file a bug with your package folder details at https://github.com/jwpkg/gitversion/issues');
    } else {
      yarnWorkspace.manifest.version = packedPackage.version;
      if (dryRun) {
        this.application.logger.reportDryrun(`Would be publishing ${packedPackage.packageName} using release tag ${releaseTag}`);
        return;
      } else {
        const registry = npmConfigUtils.getPublishRegistry(yarnWorkspace.manifest, { configuration: this.yarnConfiguration });
        const gitHead = await npmPublishUtils.getGitHead(yarnWorkspace.cwd);

        const buffer = await readFile(fileName);

        const body = await npmPublishUtils.makePublishBody(yarnWorkspace, buffer, {
          tag: releaseTag,
          access: undefined,
          registry,
          gitHead,
        });

        if (yarnWorkspace.manifest.name) {
          const url = npmHttpUtils.getIdentUrl(yarnWorkspace.manifest.name);
          await npmHttpUtils.put(url, body, {
            configuration: this.yarnConfiguration,
            registry,
            ident: yarnWorkspace.manifest.name,
            // otp: this.otp,
            jsonResponse: true,
          });
        }
      }
    }
  }
}
