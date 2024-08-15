import { lt, parse } from 'semver';

import { BranchType, VersionBranch } from './configuration';
import { GitTag } from './git';

export type GitSemverTag = {
  hash?: string;
  version: string;
};

export function determineCurrentVersion(tags: GitTag[], branch: VersionBranch, prefix: string): GitSemverTag {
  const escapeRegExp = (text: string) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  };
  const officialTags = tags.filter(x => new RegExp(`^${escapeRegExp(prefix)}[0-9]+\\.[0-9]+\\.[0-9]+$`).test(x.tagName));

  if (branch.type === BranchType.MAIN) {
    tags = officialTags;
  } else if (branch.type === BranchType.UNKNOWN) {
    throw new Error('Can\'t determine current version on branch type "UNKNOWN". Please check your settings and current branch');
  } else {
    const preReleaseTags = tags.filter(x => new RegExp(`${escapeRegExp(prefix)}[0-9]+\\.[0-9]+\\.[0-9]+-${escapeRegExp(branch.name)}\\.[0-9]+$`).test(x.tagName));
    if (preReleaseTags.length > 0) {
      tags = [...preReleaseTags, ...officialTags];
    } else {
      tags = officialTags;
    }
  }

  tags.sort((a, b) => lt(a.tagName.replace(prefix, ''), b.tagName.replace(prefix, '')) ? 1 : -1);

  let latestTag: GitTag;

  if (tags.length > 0) {
    latestTag = tags[0];
  } else {
    latestTag = {
      hash: undefined,
      tagName: 'v0.0.0',
    };
  }
  const regexReplace = new RegExp(`^${escapeRegExp(prefix)}`);
  const version = parse(latestTag.tagName.replace(regexReplace, ''));
  if (version) {
    return {
      hash: latestTag.hash,
      version: version.format(),
    };
  }
  throw new Error(`Oops something went wrong parsing version ${version}`);
}
