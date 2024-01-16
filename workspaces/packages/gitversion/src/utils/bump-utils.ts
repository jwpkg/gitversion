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
