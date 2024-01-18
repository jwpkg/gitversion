import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { SemVer, inc, prerelease } from 'semver';

import { BranchType, VersionBranch } from '../config';

import { ConventionalCommit } from './conventional-commmit-utils';

export enum BumpType {
  NONE = 0,
  PATCH = 1,
  MINOR = 2,
  MAJOR = 3,
  GRADUATE = 4,
}

const bumpMap: Record<string, BumpType> = {
  fix: BumpType.PATCH,
  feat: BumpType.MINOR,
  feature: BumpType.MINOR,
  revert: BumpType.PATCH,
  perf: BumpType.PATCH,
  performance: BumpType.PATCH,
};

// eslint-disable-next-line consistent-return
export function executeBump(version: SemVer, branch: VersionBranch, bumpType: BumpType): string | null {
  if (bumpType === BumpType.NONE) {
    return null;
  }

  if (prerelease(version)) {
    return inc(version, 'prerelease');
  }

  const preReleaseName = branch.type === BranchType.MAIN ? undefined : branch.name;
  const preReleasePrefix = branch.type === BranchType.MAIN ? '' : 'pre';

  if (version.major === 0) {
    switch (bumpType) {
      case BumpType.GRADUATE: return inc(version, `${preReleasePrefix}major`, preReleaseName);
      case BumpType.MAJOR: return inc(version, `${preReleasePrefix}minor`, preReleaseName);
      default: return inc(version, `${preReleasePrefix}patch`, preReleaseName);
    }
  } else {
    switch (bumpType) {
      case BumpType.GRADUATE: return inc(version, `${preReleasePrefix}major`, preReleaseName);
      case BumpType.MAJOR: return inc(version, `${preReleasePrefix}major`, preReleaseName);
      case BumpType.MINOR: return inc(version, `${preReleasePrefix}minor`, preReleaseName);
      case BumpType.PATCH: return inc(version, `${preReleasePrefix}patch`, preReleaseName);
    }
  }
}


export function detectBumpType(commits: ConventionalCommit[]) {
  let current: BumpType = BumpType.NONE;
  for (const commit of commits) {
    if (commit.breaking) {
      return BumpType.MAJOR;
    }

    const detected = bumpMap[commit.type];
    if (detected && detected > current) {
      current = detected;
    }
  }
  return current;
}

export interface Bump {
  packageRelativeCwd: string;
  tag: string;
  packageName: string;
  fromVersion: string;
  toVersion: string;
  changeLog: string;
}

export interface BumpManifestContent {
  bumps: Bump[];
}

export class BumpManifest {
  private constructor(private bumpManifestFile: string, public bumpManifest: BumpManifestContent) {
  }

  static async load(outputFolder: string) {
    const bumpManifestFile = join(outputFolder, 'bump-manifest.json');
    let bumpManifest: BumpManifestContent = {
      bumps: [],
    };

    if (existsSync(bumpManifestFile)) {
      const content = await readFile(bumpManifestFile, 'utf-8');
      bumpManifest = JSON.parse(content) as BumpManifestContent;
    }
    return new BumpManifest(bumpManifestFile, bumpManifest);
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
