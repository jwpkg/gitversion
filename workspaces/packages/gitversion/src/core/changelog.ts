import { ConventionalCommit, parseConventionalCommits } from './conventional-commmit-utils';
import { Git } from './git';
import * as md from './markdown';
import { GitSemverTag } from './version-utils';

const HEADER = `
# Changelog

All notable changes to this project will be documented in this file

`;

export interface ChangeLogUrls {
  compareUrl: (a: GitSemverTag, b: GitSemverTag) => string;
  commitUrl: (hash: string) => string;
}

export async function detectChangelog(relativeCwd: string, git: Git, from: GitSemverTag, to: GitSemverTag) {
  const platform = await git.platform();
  const logs = await git.logs(from.hash, relativeCwd);

  const commits = parseConventionalCommits(logs, platform);
  return generateChangeLogEntry(commits, from, to, platform);
}

export function addToChangelog(entry: string, version: string, changelogContent?: string) {
  if (changelogContent) {
    const lines = changelogContent.split('\n');

    const removeRanges: { start: number, end: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`## [${version}]`)) {
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].startsWith('## ')) {
            removeRanges.push({
              start: i,
              end: j,
            });
          }
        }
      }
    }

    for (const range of removeRanges) {
      lines.splice(range.start, range.end - range.start);
    }

    for (const [index, line] of lines.entries()) {
      if (line.startsWith('## ')) {
        lines.splice(0, index);
        break;
      }
    }
    changelogContent = lines.join('\n');
  }
  return [HEADER, entry, changelogContent].join('\n');
}

export function generateChangeLogEntry(commits: ConventionalCommit[], from: GitSemverTag, to: GitSemverTag, urls: ChangeLogUrls): string {
  return [
    md.h2(
      md.link(to.version, urls.compareUrl(from, to)),
      `(${new Date().toDateString()})`,
    ),
    ...Object.entries(groupByType(commits)).map(([type, commits]) => [
      md.h3(type),
      ...commits.map(commit => renderCommit(commit, urls)),
    ].join('\n')),

  ].join('\n');
}

export function renderCommit(commit: ConventionalCommit, urls: ChangeLogUrls) {
  if (commit.scope) {
    return md.li(md.b(commit.scope), commit.message, `(${md.link(commit.shortHash, urls.commitUrl(commit.hash))})`);
  } else {
    return md.li(commit.message, `(${md.link(commit.shortHash, urls.commitUrl(commit.hash))})`);
  }
}

export function groupByType(commits: ConventionalCommit[]): Record<string, ConventionalCommit[]> {
  const result: Record<string, ConventionalCommit[]> = {};
  commits.forEach(commit => {
    if (!result[commit.type]) {
      result[commit.type] = [commit];
    } else {
      result[commit.type].push(commit);
    }
  });
  return result;
}
