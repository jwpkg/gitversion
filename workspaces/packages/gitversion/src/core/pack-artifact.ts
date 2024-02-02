import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { BumpManifestGitStatus } from './bump-manifest';
import { ChangelogEntry } from './changelog';
import { IConfiguration } from './configuration';
import { ConventionalCommit } from './conventional-commmit-utils';

const MANIFEST_NAME = 'pack-manifest.json';
const PACK_FOLDER = 'pack';

export interface PackedPackage {
  packFile?: string;
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  version: string;
  changeLog: ChangelogEntry;
  commits: ConventionalCommit[];
}

export interface PackManifestGitStatus extends BumpManifestGitStatus {
  prePack: string;
  postPack: string;
}

export interface PackManifestContent {
  gitStatus: PackManifestGitStatus;
  packages: PackedPackage[];
}

export class PackArtifact {
  gitStatus: PackManifestGitStatus;
  packages: PackedPackage[];

  get packFolder() {
    return join(this.configuration.stagingFolder, PACK_FOLDER);
  }

  get packManifestFile() {
    return join(this.packFolder, MANIFEST_NAME);
  }

  private constructor(private configuration: IConfiguration, gitStatus: PackManifestGitStatus, packages?: PackedPackage[]) {
    this.gitStatus = gitStatus;
    this.packages = packages ?? [];
  }

  validateGitStatusWithBump() {
    return [this.gitStatus.postBump, this.gitStatus.preBump].includes(this.gitStatus.prePack);
  }

  validateGitStatusDuringPack() {
    return this.gitStatus.prePack == this.gitStatus.postPack;
  }

  async validateGitStatusForPublish() {
    return [
      this.gitStatus.preBump,
      this.gitStatus.postBump,
      this.gitStatus.prePack,
      this.gitStatus.postPack,
    ].includes(await this.configuration.git.gitStatusHash());
  }

  static async load(configuration: IConfiguration): Promise<PackArtifact | null> {
    const packFolder = join(configuration.stagingFolder, PACK_FOLDER);
    const manifestFile = join(packFolder, MANIFEST_NAME);

    if (existsSync(manifestFile)) {
      const content = await readFile(manifestFile, 'utf-8');
      const manifest = JSON.parse(content) as PackManifestContent;
      return new PackArtifact(configuration, manifest.gitStatus, manifest.packages);
    }
    return null;
  }

  static async new(configuration: IConfiguration, bumpGitStatus: BumpManifestGitStatus) {
    const statusHash = await configuration.git.gitStatusHash();
    const gitStatus: PackManifestGitStatus = {
      ...bumpGitStatus,
      prePack: statusHash,
      postPack: 'INVALID',
    };

    await this.clear(configuration);
    return new PackArtifact(configuration, gitStatus);
  }

  static async clear(configuration: IConfiguration) {
    await rm(join(configuration.stagingFolder, 'pack'), {
      force: true,
      recursive: true,
    });
  }

  add(packedPackage: PackedPackage) {
    this.packages.push(packedPackage);
  }

  async persist() {
    this.gitStatus.postPack = await this.configuration.git.gitStatusHash();
    const content: PackManifestContent = {
      gitStatus: this.gitStatus,
      packages: this.packages,
    };
    const contentData = JSON.stringify(content, null, 2);
    await mkdir(dirname(this.packManifestFile), {
      recursive: true,
    });

    await writeFile(this.packManifestFile, contentData, {
      encoding: 'utf-8',

    });
  }
}
