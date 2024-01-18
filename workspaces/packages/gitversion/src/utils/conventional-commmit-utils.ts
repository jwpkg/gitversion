import { IGitPlatform } from './git-platform';
import { GitCommit } from './git';

export enum ConventionalCommitFooterType {
  note,
  ref,
}

export interface ConventionalCommitFooter {
  type: ConventionalCommitFooterType;
  name: string;
  value: string;
}

export interface ConventionalCommit {
  type: string;
  message: string;
  scope?: string;
  breaking: boolean;
  breakingReason?: string;
  body: string;
  footers: ConventionalCommitFooter[];
}


export function parseConventionalCommits(commits: GitCommit[], platform: IGitPlatform): ConventionalCommit[] {
  const sanitizedCommits = commits.map(platform.stripMergeMessage);
  return sanitizedCommits.map(parseConventionalCommit).filter((c): c is ConventionalCommit => !!c);
}

export function parseConventionalCommit(commit: GitCommit): ConventionalCommit | undefined {
  const headerRegex = /^([a-zA-Z]+)(\([\w\-\\/.]+\))?(!)?:\s(.+)([\s\S]*)/i;
  const fullText = `${commit.subject}\n\n${commit.body}`.trim();
  const lines = fullText.split('\n');

  const header = lines.splice(0, 1).join('\n').trim();
  const result = headerRegex.exec(header);

  if (!result) {
    return undefined;
  }

  const currentCommit: ConventionalCommit = {
    type: result[1].toLowerCase(),
    scope: result[2]?.replace(/[()]/g, ''),
    breaking: result[3] === '!',
    message: result[4],
    body: '',
    footers: [],
  };

  const footers: string[] = [];
  let isBody = true;
  let currentElement = '';

  while (lines.length > 0) {
    if (isFooterStart(lines[0])) {
      if (isBody) {
        currentCommit.body = currentElement.trim();
      } else {
        footers.push(currentElement.trim());
      }
      currentElement = '';
      isBody = false;
    }
    currentElement += `\n${lines.splice(0, 1)}`;
  }

  if (isBody) {
    currentCommit.body = currentElement.trim();
  } else {
    footers.push(currentElement.trim());
  }

  for (const footer of footers) {
    if (footer.startsWith('BREAKING CHANGE: ')) {
      currentCommit.breaking = true;
      currentCommit.breakingReason = footer.replace(/^BREAKING CHANGE: /, '');
    } else {
      const regex = /(^[\w-]+)(:\s|\s#)/i;
      const footerStart = regex.exec(footer);
      if (footerStart) {
        currentCommit.footers.push({
          type: footerStart[2].startsWith(':') ? ConventionalCommitFooterType.note : ConventionalCommitFooterType.ref,
          name: footerStart[1],
          value: footer.replace(footerStart[0], ''),
        });
      }
    }
  }

  return currentCommit;
}

export function isFooterStart(line: string) {
  const footerRegex = /^[\w-]+(:\s|\s#)\w+|^BREAKING CHANGE:\s/i;
  return footerRegex.test(line);
}
