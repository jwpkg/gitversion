import { colorize } from 'colorize-node';
import { SemVer } from 'semver';

import { BranchType, VersionBranch } from '../config';

import { BumpType } from './bump-utils';

export function formatDuration(duration: number) {
  if (duration > 1000 * 60) {
    const minutes = Math.floor(duration / 1000 / 60);
    const seconds = Math.ceil((duration - minutes * 60 * 1000) / 1000);
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  } else if (duration > 1000) {
    const seconds = Math.floor(duration / 1000);
    const milliseconds = duration - seconds * 1000;
    return milliseconds === 0 ? `${seconds}s` : `${seconds}s ${milliseconds}ms`;
  } else {
    return `${duration}ms`;
  }
}

// eslint-disable-next-line consistent-return
export function formatVersionBranch(branch: VersionBranch) {
  switch (branch.type) {
    case BranchType.UNKNOWN: return colorize.redBright('Unknown');
    case BranchType.MAIN: return colorize.greenBright('main');
    case BranchType.FEATURE: return `${colorize.yellowBright('feature')} (${colorize.magentaBright(branch.name)})`;
    case BranchType.RELEASE: return `${colorize.yellowBright('release')} (${colorize.magentaBright(branch.name)})`;
  }
}

export function formatVersion(version: SemVer | string) {
  const versionString = typeof version === 'string' ? version : version.format();
  return colorize.cyanBright(versionString);
}

// eslint-disable-next-line consistent-return
export function formatBumpType(bumpType: BumpType) {
  switch (bumpType) {
    case BumpType.GRADUATE: return colorize.redBright('GRADUATE');
    case BumpType.MAJOR: return colorize.redBright('MAJOR');
    case BumpType.MINOR: return colorize.yellowBright('MINOR');
    case BumpType.PATCH: return colorize.greenBright('PATCH');
    case BumpType.NONE: return colorize.greenBright('NONE');
  }
}

export function formatPackageName(name: string) {
  const regex = /^(@.*\/)?(.*)$/;
  const result = regex.exec(name);
  if (result && result[1]) {
    return `${colorize.blueBright(result[1])}${colorize.magentaBright(result[2])}`;
  }
  return `${colorize.magentaBright(name)}`;
}
