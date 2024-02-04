import { colorize } from 'colorize-node';
import { inc, parse, prerelease } from 'semver';

import { BranchType, FeatureBumpBehavior, IConfiguration, VersionBranch } from './configuration';
import { ConventionalCommit } from './conventional-commmit-utils';
import { GitCommit } from './git';
import { LogReporter } from './log-reporter';

export enum BumpType {
  NONE = 'NONE',
  PATCH = 'PATCH',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  GRADUATE = 'GRADUATE',
}

const bumpIndex: Record<BumpType, number> = {
  [BumpType.NONE]: 0,
  [BumpType.PATCH]: 1,
  [BumpType.MINOR]: 2,
  [BumpType.MAJOR]: 3,
  [BumpType.GRADUATE]: 4,
};

const bumpMap: Record<string, BumpType> = {
  fix: BumpType.PATCH,
  feat: BumpType.MINOR,
  feature: BumpType.MINOR,
  revert: BumpType.PATCH,
  perf: BumpType.PATCH,
  performance: BumpType.PATCH,
};

// eslint-disable-next-line consistent-return
export function executeBump(version: string, branch: VersionBranch, bumpType: BumpType): string | null {
  if (bumpType === BumpType.NONE) {
    return null;
  }

  const semver = parse(version);

  if (!semver) {
    return null;
  }

  if (prerelease(semver)) {
    return inc(version, 'prerelease');
  }

  const preReleaseName = branch.type === BranchType.MAIN ? undefined : branch.name;
  const preReleasePrefix = branch.type === BranchType.MAIN ? '' : 'pre';

  if (semver.major === 0) {
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
    if (detected && bumpIndex[detected] > bumpIndex[current]) {
      current = detected;
    }
  }
  return current;
}

export function validateBumpType(bumpType: BumpType, rawCommits: GitCommit[], configuration: IConfiguration, branch: VersionBranch, logger: LogReporter) {
  if (branch.type === BranchType.FEATURE) {
    switch (configuration.options.featureBumpBehavior) {
      case FeatureBumpBehavior.Never:
        logger.reportInfo(`On feature branch with featureBumpBehavior: Never. Forcing bumptype to ${colorize.greenBright('NONE')} `);
        return BumpType.NONE;
      case FeatureBumpBehavior.Normal: return bumpType;
    }
    // all commits
    if (bumpType === BumpType.NONE && rawCommits.length > 0) {
      logger.reportInfo(`Found ${colorize.cyan(rawCommits.length)} normal commits and will bump feature branch with ${colorize.greenBright('PATCH')}`);
      return BumpType.PATCH;
    }
  }

  return bumpType;
}
