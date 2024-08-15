import { colorize } from 'colorize-node';
import { inc, parse, prerelease } from 'semver';

import { BranchType, IConfiguration, VersionBranch } from './configuration';
import { ConventionalCommit } from './conventional-commmit-utils';
import { GitCommit } from './git';
import { LogReporter } from './log-reporter';


export class BumpType {
  private precedence: number;
  public readonly explicitVersion?: string;

  static readonly SKIP = new BumpType(100);
  static readonly NONE = new BumpType(0);
  static readonly PATCH = new BumpType(1);
  static readonly MINOR = new BumpType(2);
  static readonly MAJOR = new BumpType(3);
  static readonly GRADUATE = new BumpType(4);

  static explicit(version: string) {
    return new BumpType(10, version);
  }

  static parse(bumpTypeName: string) {
    switch (bumpTypeName.toLowerCase()) {
      case 'major': return BumpType.MAJOR;
      case 'minor': return BumpType.MINOR;
      case 'patch': return BumpType.PATCH;
      case 'graduate': return BumpType.GRADUATE;
      case 'none': return BumpType.NONE;
      case 'skip': return BumpType.SKIP;
    }

    if (parse(bumpTypeName)) {
      return BumpType.explicit(bumpTypeName);
    }
    return BumpType.NONE;
  }

  static tryParse(bumpTypeName?: string) {
    if (bumpTypeName) {
      return this.parse(bumpTypeName);
    }
    return undefined;
  }

  toString() {
    switch (this) {
      case BumpType.MAJOR: return 'major';
      case BumpType.MINOR: return 'major';
      case BumpType.PATCH: return 'major';
      case BumpType.GRADUATE: return 'major';
      case BumpType.NONE: return 'none';
      case BumpType.SKIP: return 'skip';
    }
    if (this.explicitVersion) {
      return this.explicitVersion;
    }
    return 'none';
  }

  gt(compare: BumpType) {
    return this.precedence > compare.precedence;
  }

  private constructor(precedence: number, explicitVersion?: string) {
    this.precedence = precedence;
    this.explicitVersion = explicitVersion;
  }
}

const bumpMap: Record<string, BumpType> = {
  fix: BumpType.PATCH,
  feat: BumpType.MINOR,
  feature: BumpType.MINOR,
  revert: BumpType.PATCH,
  perf: BumpType.PATCH,
  performance: BumpType.PATCH,
};


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
  return null;
}


export function detectBumpType(commits: ConventionalCommit[]) {
  let current: BumpType = BumpType.NONE;
  for (const commit of commits) {
    if (commit.breaking) {
      return BumpType.MAJOR;
    }

    const detected = bumpMap[commit.type];
    if (detected && detected.gt(current)) {
      current = detected;
    }
  }
  return current;
}

export function validateBumpType(bumpType: BumpType, rawCommits: GitCommit[], configuration: IConfiguration, branch: VersionBranch, logger: LogReporter) {
  if (branch.type === BranchType.FEATURE) {
    switch (configuration.options.featureBumpBehavior) {
      case 'never':
        logger.reportInfo(`On feature branch with featureBumpBehavior: Never. Forcing bumptype to ${colorize.greenBright('NONE')} `);
        return BumpType.NONE;
      case 'normal': return bumpType;
    }
    // all commits
    if (bumpType === BumpType.NONE && rawCommits.length > 0) {
      logger.reportInfo(`Found ${colorize.cyan(rawCommits.length)} normal commits and will bump feature branch with ${colorize.greenBright('PATCH')}`);
      return BumpType.PATCH;
    }
  }

  return bumpType;
}
