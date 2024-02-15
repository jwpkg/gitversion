import { colorize } from 'colorize-node';
import { SemVer } from 'semver';

import { BumpType } from './bump-utils';
import { BranchType, VersionBranch } from './configuration';

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
    case BranchType.UNKNOWN: return `${colorize.yellowBright('unknown')} (${colorize.magentaBright(branch.name)})`;
    case BranchType.MAIN: return `${colorize.yellowBright('main')} (${colorize.magentaBright(branch.name)})`;
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
    case BumpType.SKIP: return colorize.gray('SKIP');
  }
  return colorize.green(`explicit (${bumpType.explicitVersion})`);
}

export function formatPackageName(name: string) {
  const regex = /^(@.*\/)?(.*)$/;
  const result = regex.exec(name);
  if (result && result[1]) {
    return `${colorize.magenta(result[1])}${colorize.magentaBright(result[2])}`;
  }
  return `${colorize.magenta(name)}`;
}

export function formatFileSize(size: number) {
  if (size <= 0) return '0';
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const digitGroups = (Math.log10(size) / Math.log10(1024));
  const num = (size / Math.pow(1024, Math.floor(digitGroups)));

  const result = `${Math.floor(num * 10) / 10}${units[Math.floor(digitGroups)]}`;
  if (digitGroups <= 1) {
    return colorize.greenBright(result);
  } else if (digitGroups <= 2) {
    return colorize.yellowBright(result);
  } else return colorize.redBright(result);
}
