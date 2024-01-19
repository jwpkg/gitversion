import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { Project } from './workspace-utils';

export interface PackedPackage {
  packFile: string;
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  version: string;
  changeLog: string;
}

export interface PackManifestContent {
  packages: PackedPackage[];
}

export class PackManifest {
  packManifest: PackManifestContent;
  packManifestFile: string;
  packFolder: string;

  constructor(project: Project, packManifest?: PackManifestContent) {
    this.packFolder = join(project.stagingFolder, 'pack');
    this.packManifestFile = PackManifest.manifestFile(project);
    this.packManifest = packManifest ?? {
      packages: [],
    };
  }

  private static manifestFile(project: Project) {
    return join(project.stagingFolder, 'pack', 'pack-manifest.json');
  }

  static async clear(project: Project) {
    await rm(join(project.stagingFolder, 'pack'), {
      force: true,
      recursive: true,
    });
  }

  static async load(project: Project) {
    const bumpManifestFile = PackManifest.manifestFile(project);
    let bumpManifest: PackManifestContent = {
      packages: [],
    };

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      bumpManifest = JSON.parse(content) as PackManifestContent;
    }
    return new PackManifest(project, bumpManifest);
  }

  add(packedPackage: PackedPackage) {
    this.packManifest.packages.push(packedPackage);
  }

  async clear() {
    this.packManifest.packages = [];
    await rm(dirname(this.packManifestFile), {
      force: true,
      recursive: true,
    });
  }

  async persist() {
    const content = JSON.stringify(this.packManifest, null, 2);
    await mkdir(dirname(this.packManifestFile), {
      recursive: true,
    });

    await writeFile(this.packManifestFile, content, {
      encoding: 'utf-8',

    });
  }
}
