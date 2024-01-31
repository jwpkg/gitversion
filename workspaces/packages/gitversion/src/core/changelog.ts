import { IChangelogRenderFunctions } from '../plugins';

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
  return generateChangeLogEntry(commits, from, to, project.config.pluginManager);
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

export function generateChangeLogEntry(commits: ConventionalCommit[], from: GitSemverTag, to: GitSemverTag, renderer: IChangelogRenderFunctions): string {
  const compareUrl = renderer.renderCompareUrl(from, to);
  return [
    md.h2(
      compareUrl ? md.link(to.version, compareUrl) : `[${to.version}]`,
      `(${new Date().toDateString()})`,
    ),
    ...Object.entries(groupByType(commits)).map(([type, commits]) => [
      md.h3(type),
      ...commits.map(commit => renderCommit(commit, renderer)),
    ].join('\n')),

  ].join('\n');
}

export function renderCommit(commit: ConventionalCommit, renderer: IChangelogRenderFunctions) {
  const commitUrl = renderer.renderCommitUrl(commit.hash);
  if (commit.scope) {
    return md.li(md.b(commit.scope), commit.message, `(${commitUrl ? md.link(commit.shortHash, commitUrl) : commit.shortHash})`);
  } else {
    return md.li(commit.message, `(${commitUrl ? md.link(commit.shortHash, commitUrl) : commit.shortHash})`);
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
