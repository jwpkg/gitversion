import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { Project, Workspace } from './workspace-utils';

const MANIFEST_NAME = 'bump-manifest.json';

export interface Bump {
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  version: string;
  changeLog: string;
  private: boolean;
}

export interface BumpManifestContent {
  preBumpStatusHash: string;
  postBumpStatusHash: string;
  bumps: Bump[];
}

export class BumpManifest {
  private preBumpStatusHash?: string;
  bumps: Bump[];

  private constructor(public bumpManifestFile: string, private project: Project, manifest?: BumpManifestContent) {
    this.bumps = manifest?.bumps ?? [];
  }

  static async load(project: Project) {
    const bumpManifestFile = join(project.stagingFolder, MANIFEST_NAME);
    const statusHash = await project.git.gitStatusHash();

    let bumpManifest: BumpManifestContent = {
      preBumpStatusHash: statusHash,
      postBumpStatusHash: statusHash,
      bumps: [],
    };

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      bumpManifest = JSON.parse(content) as BumpManifestContent;
    }

    return new BumpManifest(
      bumpManifestFile,
      project,
      bumpManifest,
    );
  }

  static async new(project: Project) {
    await this.clear(project);
    const bumpManifestFile = join(project.stagingFolder, MANIFEST_NAME);
    const result = new BumpManifest(bumpManifestFile, project);

    result.preBumpStatusHash = await project.git.gitStatusHash();

    return result;
  }

  static async clear(project: Project) {
    rm(join(project.stagingFolder, MANIFEST_NAME), {
      force: true,
    });
  }

  add(workspace: Workspace, version: string, changeLog: string) {
    this.bumps.push({
      changeLog,
      packageName: workspace.packageName,
      packageRelativeCwd: workspace.relativeCwd,
      version,
      tag: workspace.tagPrefix + version,
      private: workspace.manifest.private === true,
    });
  }

  async persist() {
    if (!this.preBumpStatusHash) {
      throw new Error('No pre bump status hash set');
    }
    const content: BumpManifestContent = {
      preBumpStatusHash: this.preBumpStatusHash,
      postBumpStatusHash: await this.project.git.gitStatusHash(),
      bumps: this.bumps,
    };

    const contentData = JSON.stringify(content, null, 2);
    await mkdir(dirname(this.bumpManifestFile), {
      recursive: true,
    });

    await writeFile(this.bumpManifestFile, contentData, {
      encoding: 'utf-8',
    });
  }
}
