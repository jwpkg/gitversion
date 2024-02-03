import { IChangelogRenderFunctions } from '../plugins';

import { IApplication } from './application';
import { ConventionalCommit, parseConventionalCommits } from './conventional-commmit-utils';
import * as md from './markdown';
import { GitSemverTag } from './version-utils';

const HEADER = `
# Changelog

All notable changes to this project will be documented in this file

`;

export interface ChangelogEntry {
  version: string;
  headerLine: string;
  body: string;
}

export async function detectChangelog(application: IApplication, relativeCwd: string, from: GitSemverTag, to: GitSemverTag) {
  const logs = await application.git.logs(from.hash, relativeCwd);

  const commits = parseConventionalCommits(logs, application.gitPlatform);
  return generateChangeLogEntry(commits, from, to, application.pluginManager);
}

export function addToChangelog(entry: ChangelogEntry, version: string, changelogContent?: string) {
  const entries: ChangelogEntry[] = [entry];
  if (changelogContent) {
    const allEntries = parseChangelog(changelogContent);
    entries.push(...allEntries.filter(e => e.version !== version));
  }
  return [
    HEADER,
    ...entries.map(e => `${e.headerLine.trim()}\n\n${e.body.trim()}\n`),
  ].join('\n');
}

export function parseChangelog(changelogContent: string): ChangelogEntry[] {
  const result: ChangelogEntry[] = [];
  let current: ChangelogEntry | undefined;

  const lines = changelogContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      if (current) result.push(current);
      current = undefined;
      const parsedHeader = /##\s\[([a-zA-Z0-9-.]+)\]/.exec(lines[i]);
      if (parsedHeader) {
        current = {
          headerLine: lines[i],
          version: parsedHeader[1],
          body: '',
        };
      }
    } else {
      if (current) {
        current.body = `${current.body}\n${lines[i]}`;
      }
    }
  }

  if (current) result.push(current);

  return result;
}

export function generateChangeLogEntry(commits: ConventionalCommit[], from: GitSemverTag, to: GitSemverTag, renderer: IChangelogRenderFunctions): ChangelogEntry {
  const compareUrl = renderer.renderCompareUrl(from, to);

  return {
    headerLine: md.h2(
      compareUrl ? md.link(to.version, compareUrl) : `[${to.version}]`,
      `(${new Date().toDateString()})`,
    ),
    version: to.version,
    body: [...Object.entries(groupByType(commits)).map(([type, commits]) => [
      md.h3(type),
      ...commits.map(commit => renderCommit(commit, renderer)),
    ].join('\n')),
    ].join('\n'),
  };
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
