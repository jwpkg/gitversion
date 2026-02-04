import { cp, mkdtemp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { PackedPackage } from '../../../core/pack-artifact';
import { IWorkspace } from '../../../core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '../..';

import { NodeWorkspace } from './node-project';

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
    if (!(workspace instanceof NodeWorkspace)) {
      return null;
    }

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
    }

    // Check if running in CI environment
    const isCI = process.env.CI === 'true' || 
                 process.env.GITHUB_ACTIONS === 'true' || 
                 process.env.GITLAB_CI === 'true' ||
                 process.env.CIRCLECI === 'true' ||
                 process.env.TRAVIS === 'true' ||
                 process.env.JENKINS_URL !== undefined ||
                 process.env.BUILDKITE === 'true';

    if (isCI && !process.stdin.isTTY) {
      // In CI without TTY, we need to ensure npm doesn't prompt for OTP
      // Check if we have an automation token by verifying the token type
      this.application.logger.reportInfo('Running in CI environment - ensuring non-interactive mode');
      
      try {
        await this.application.executor.exec(['npm', 'publish', fileName, '--tag', releaseTag, '--access', 'public', '--verbose'], {
          cwd: this.application.packFolder,
        });
      } catch (error) {
        // Check if error is related to OTP
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('one-time password') || errorMessage.includes('OTP')) {
          throw new Error(
            `Publishing failed: npm is requesting a one-time password (OTP) in CI environment.\n` +
            `This typically happens when:\n` +
            `  1. Your npm account has 2FA enabled (good!)\n` +
            `  2. The NPM_AUTH_TOKEN is a "Classic" token that requires OTP\n` +
            `\n` +
            `To fix this:\n` +
            `  1. Log in to npmjs.com\n` +
            `  2. Go to Access Tokens → Generate New Token\n` +
            `  3. Select "Automation" token type (bypasses OTP for CI/CD)\n` +
            `  4. Update your NPM_AUTH_TOKEN secret with this new token\n` +
            `\n` +
            `Original error: ${errorMessage}`
          );
        }
        throw error;
      }
    } else {
      await this.application.executor.exec(['npm', 'publish', fileName, '--tag', releaseTag, '--access', 'public', '--verbose'], {
        cwd: this.application.packFolder,
      });
    }
  }
}
