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
  bumps: Bump[];
}

export class BumpManifest {
  manifest: BumpManifestContent;

  private constructor(public bumpManifestFile: string, manifest?: BumpManifestContent) {
    this.manifest = manifest ?? {
      bumps: [],
    };
  }

  static async load(project: Project) {
    const bumpManifestFile = join(project.stagingFolder, MANIFEST_NAME);

    let bumpManifest: BumpManifestContent = {
      bumps: [],
    };

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      bumpManifest = JSON.parse(content) as BumpManifestContent;
    }

    return new BumpManifest(bumpManifestFile, bumpManifest);
  }

  static async new(project: Project) {
    await this.clear(project);
    const bumpManifestFile = join(project.stagingFolder, MANIFEST_NAME);
    return new BumpManifest(bumpManifestFile);
  }

  static async clear(project: Project) {
    rm(join(project.stagingFolder, MANIFEST_NAME), {
      force: true,
    });
  }

  add(workspace: Workspace, version: string, changeLog: string) {
    this.manifest.bumps.push({
      changeLog,
      packageName: workspace.packageName,
      packageRelativeCwd: workspace.relativeCwd,
      version,
      tag: workspace.tagPrefix + version,
      private: workspace.manifest.private === true,
    });
  }

  async persist() {
    const content = JSON.stringify(this.manifest, null, 2);
    await mkdir(dirname(this.bumpManifestFile), {
      recursive: true,
    });

    await writeFile(this.bumpManifestFile, content, {
      encoding: 'utf-8',

    });
  }
}
