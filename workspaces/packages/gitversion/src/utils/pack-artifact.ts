import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { Project } from './workspace-utils';

const MANIFEST_NAME = 'pack-manifest.json';
const PACK_FOLDER = 'pack';

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

export class PackArtifact {
  manifest: PackManifestContent;
  manifestFile: string;

  private constructor(public packFolder: string, manifest?: PackManifestContent) {
    this.manifestFile = join(packFolder, MANIFEST_NAME);
    this.manifest = manifest ?? {
      packages: [],
    };
  }

  static async load(project: Project) {
    const packFolder = join(project.stagingFolder, PACK_FOLDER);
    const manifestFile = join(packFolder, MANIFEST_NAME);

    let manifest: PackManifestContent = {
      packages: [],
    };

    if (existsSync(manifestFile)) {
      const content = await readFile(manifestFile, 'utf-8');
      manifest = JSON.parse(content) as PackManifestContent;
    }
    return new PackArtifact(packFolder, manifest);
  }

  static async new(project: Project) {
    const packFolder = join(project.stagingFolder, PACK_FOLDER);

    await this.clear(project);
    return new PackArtifact(packFolder);
  }

  static async clear(project: Project) {
    await rm(join(project.stagingFolder, 'pack'), {
      force: true,
      recursive: true,
    });
  }

  add(packedPackage: PackedPackage) {
    this.manifest.packages.push(packedPackage);
  }

  async persist() {
    const content = JSON.stringify(this.manifest, null, 2);
    await mkdir(dirname(this.manifestFile), {
      recursive: true,
    });

    await writeFile(this.manifestFile, content, {
      encoding: 'utf-8',

    });
  }
}
