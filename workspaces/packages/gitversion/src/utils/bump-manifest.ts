import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { Project } from './workspace-utils';

export interface Bump {
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  fromVersion: string;
  toVersion: string;
  changeLog: string;
  private: boolean;
}

export interface BumpManifestContent {
  bumps: Bump[];
}

export class BumpManifest {
  bumpManifest: BumpManifestContent;
  bumpManifestFile: string;

  constructor(project: Project, bumpManifest?: BumpManifestContent) {
    this.bumpManifestFile = BumpManifest.manifestFile(project);
    this.bumpManifest = bumpManifest ?? {
      bumps: [],
    };
  }

  private static manifestFile(project: Project) {
    return join(project.stagingFolder, 'bump-manifest.json');
  }

  static async clear(project: Project) {
    rm(BumpManifest.manifestFile(project), {
      force: true,
    });
  }

  static async load(project: Project) {
    const bumpManifestFile = BumpManifest.manifestFile(project);
    let bumpManifest: BumpManifestContent = {
      bumps: [],
    };

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      bumpManifest = JSON.parse(content) as BumpManifestContent;
    }
    return new BumpManifest(project, bumpManifest);
  }

  add(bump: Bump) {
    this.bumpManifest.bumps.push(bump);
  }

  async clear() {
    this.bumpManifest.bumps = [];
    rm(this.bumpManifestFile, {
      force: true,
    });
  }

  async persist() {
    const content = JSON.stringify(this.bumpManifest, null, 2);
    await mkdir(dirname(this.bumpManifestFile), {
      recursive: true,
    });

    await writeFile(this.bumpManifestFile, content, {
      encoding: 'utf-8',

    });
  }
}
