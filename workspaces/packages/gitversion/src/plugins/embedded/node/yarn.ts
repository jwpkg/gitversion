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

import { NodeWorkspace } from './node-project';

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
    if (!(workspace instanceof NodeWorkspace)) {
      return null;
    }

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
        // Check if running in CI environment
        const isCI = process.env.CI === 'true' ||
                     process.env.GITHUB_ACTIONS === 'true' ||
                     process.env.GITLAB_CI === 'true' ||
                     process.env.CIRCLECI === 'true' ||
                     process.env.TRAVIS === 'true' ||
                     process.env.JENKINS_URL !== undefined ||
                     process.env.BUILDKITE === 'true';

        if (isCI && !process.stdin.isTTY) {
          this.application.logger.reportInfo('Running in CI environment - ensuring non-interactive mode');
        }

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

          try {
            await npmHttpUtils.put(url, body, {
              configuration: this.yarnConfiguration,
              registry,
              ident: yarnWorkspace.manifest.name,
              // otp: this.otp,
              jsonResponse: true,
            });
          } catch (error) {
            // Check if error is related to OTP/2FA
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorString = JSON.stringify(error);

            if (isCI && !process.stdin.isTTY &&
                (errorMessage.includes('one-time password') ||
                 errorMessage.includes('OTP') ||
                 errorMessage.includes('otpRequired') ||
                 errorString.includes('EOTP'))) {
              throw new Error(
                'Publishing failed: npm registry is requesting a one-time password (OTP) in CI environment.\n' +
                'This typically happens when:\n' +
                '  1. Your npm account has 2FA enabled (good!)\n' +
                '  2. The NPM_AUTH_TOKEN is a "Classic" or "Publish" token that requires OTP\n' +
                '\n' +
                'To fix this:\n' +
                '  1. Log in to npmjs.com\n' +
                '  2. Go to Access Tokens → Generate New Token\n' +
                '  3. Select "Automation" token type (bypasses OTP for CI/CD)\n' +
                '  4. Update your NPM_AUTH_TOKEN secret with this new automation token\n' +
                '\n' +
                `Original error: ${errorMessage}`,
              );
            }
            throw error;
          }
        }
      }
    }
  }
}
