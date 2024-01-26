import { IGitPlatformPlugin } from '../plugins/git-platform';

import { ConventionalCommit, parseConventionalCommits } from './conventional-commmit-utils';
import * as md from './markdown';
import { GitSemverTag } from './version-utils';
import { Project } from './workspace-utils';

const HEADER = `
# Changelog

All notable changes to this project will be documented in this file

`;

export async function detectChangelog(relativeCwd: string, project: Project, from: GitSemverTag, to: GitSemverTag) {
  const logs = await project.git.logs(from.hash, relativeCwd);

  const commits = parseConventionalCommits(logs, project.gitPlatform);
  return generateChangeLogEntry(commits, from, to, project.gitPlatform);
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

export function generateChangeLogEntry(commits: ConventionalCommit[], from: GitSemverTag, to: GitSemverTag, urls: IGitPlatformPlugin): string {
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

export function renderCommit(commit: ConventionalCommit, urls: IGitPlatformPlugin) {
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
