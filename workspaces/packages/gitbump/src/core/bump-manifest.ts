import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { IApplication } from './application';
import { ChangelogEntry } from './changelog';
import { IConfiguration } from './configuration';
import { ConventionalCommit } from './conventional-commmit-utils';
import { IWorkspace } from './workspace-utils';

const MANIFEST_NAME = 'bump-manifest.json';

export interface Bump {
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  version: string;
  changeLog: ChangelogEntry;
  private: boolean;
  commits: ConventionalCommit[];
}

export interface BumpManifestGitStatus {
  preBump: string;
  postBump: string;
}

export interface BumpManifestContent {
  gitStatus: BumpManifestGitStatus;
  bumps: Bump[];
}

export class BumpManifest {
  gitStatus: BumpManifestGitStatus;
  bumps: Bump[];

  private constructor(private application: IApplication, gitStatus: BumpManifestGitStatus, bumps?: Bump[]) {
    this.bumps = bumps ?? [];
    this.gitStatus = gitStatus;
  }

  static async load(application: IApplication): Promise<BumpManifest | null> {
    const bumpManifestFile = join(application.configuration.stagingFolder, MANIFEST_NAME);

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      const manifest = JSON.parse(content) as BumpManifestContent;
      return new BumpManifest(
        application,
        manifest.gitStatus,
        manifest.bumps,
      );
    }
    return null;
  }

  static async new(application: IApplication) {
    await this.clear(application.configuration);
    const gitStatus = await application.git.gitStatusHash();
    const result = new BumpManifest(application, {
      preBump: gitStatus,
      postBump: 'INVALID',
    });

    return result;
  }

  static async clear(configuration: IConfiguration) {
    rm(join(configuration.stagingFolder, MANIFEST_NAME), {
      force: true,
    });
  }

  add(workspace: IWorkspace, version: string, changeLog: ChangelogEntry, commits: ConventionalCommit[]) {
    this.bumps.push({
      changeLog,
      packageName: workspace.packageName,
      packageRelativeCwd: workspace.relativeCwd,
      version,
      tag: workspace.tagPrefix + version,
      private: workspace.manifest.private === true,
      commits,
    });
  }

  async persist() {
    if (!this.gitStatus.preBump) {
      throw new Error('No pre bump status hash set');
    }
    const bumpManifestFile = join(this.application.configuration.stagingFolder, MANIFEST_NAME);
    const content: BumpManifestContent = {
      gitStatus: {
        preBump: this.gitStatus.preBump,
        postBump: await this.application.git.gitStatusHash(),
      },
      bumps: this.bumps,
    };

    const contentData = JSON.stringify(content, null, 2);
    await mkdir(dirname(bumpManifestFile), {
      recursive: true,
    });

    await writeFile(bumpManifestFile, contentData, {
      encoding: 'utf-8',
    });
  }
}
