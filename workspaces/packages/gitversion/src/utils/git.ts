import { async as crossSpawnAsync } from 'cross-spawn-extra';

import { Generic, Github, IGitPlatform } from './git-platform';

const delim1 = 'E2B4D2F3-B7AF-4377-BF0F-D81F4E0723F3';
const delim2 = '25B7DA41-228B-4679-B2A2-86E328D3C3DE';
const endRegex = new RegExp(`${delim2}\\r?\\n?$`);

export interface GitCommit {
  subject: string;
  body: string;
  date: Date;
  hash: string;
}

export interface GitTag {
  tagName: string;
  hash?: string;
}

export async function gitExec(args: string[], cwd?: string) {
  const output = await crossSpawnAsync('git', args, {
    cwd,
  });
  return output.stdout
    .toString()
    .replace(/\\r?\\n?$/, '')
    .trim();
}

export async function gitRoot(): Promise<string> {
  return gitExec(['rev-parse', '--show-toplevel']);
}

export class Git {
  constructor(private cwd: string) {
  }

  async logs(sinceHash?: string, relativeCwd?: string): Promise<GitCommit[]> {
    const formatFlag = `--format=format:%s${delim1}%cI${delim1}%H${delim1}%b${delim2}`;

    const parseEntry = (entry?: string): GitCommit | undefined => {
      if (entry && entry.length > 0) {
        const [subject, date, hash, body] = entry.split(delim1);

        return {
          subject: subject.trim(),
          date: new Date(date),
          hash: hash.trim(),
          body: body.trim(),
        };
      }
      return undefined;
    };

    const args = [
      'log',
      '--reverse',
      formatFlag,
    ];

    if (sinceHash) {
      args.push(`${sinceHash}..`);
    }

    if (relativeCwd) {
      args.push('--', relativeCwd);
    }

    const output = await gitExec(args, this.cwd);

    return output
      .replace(endRegex, '')
      .split(delim2)
      .map(parseEntry)
      .filter((e): e is GitCommit => !!e);
  }

  async versionTags(prefix: string = 'v'): Promise<GitTag[]> {
    const prefixFilter = `${prefix}*`;

    const parseEntry = (entry?: string): GitTag | undefined => {
      if (entry && entry.length > 0) {
        const [hash, tagName] = entry.trim().split(delim1);

        return {
          hash,
          tagName,
        };
      }
      return undefined;
    };

    const args = [
      '-c',
      'versionsort.suffix=-', // makes sure pre-release versions are listed after the primary version
      'tag',
      '--sort=-version:refname', // sort as versions and not lexicographically
      '--list',
      `--format=%(objectname)${delim1}%(refname:strip=2)${delim2}`,
      prefixFilter,
    ];

    const output = await gitExec(args, this.cwd);

    return output
      .replace(endRegex, '')
      .split(delim2)
      .map(parseEntry)
      .filter(e => e !== undefined)
      .map(e => e as GitTag);
  }

  async addTag(tag: string) {
    await gitExec(['tag', tag]);
  }

  async addAndCommitFiles(message: string, files: string[]) {
    await gitExec(['add', ...files]);
    await gitExec(['commit', '-m', `'${message} [skip ci]'`, '--', ...files]);
  }


  async push() {
    const result = await gitExec(['push', 'origin', '--follow-tags']);
    console.log('GIT PUSH', result);
  }

  async currentBranch() {
    // azure devops lookup
    if (process.env.BUILD_SOURCEBRANCHNAME) {
      return process.env.BUILD_SOURCEBRANCHNAME;
    }

    const args = [
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ];

    const output = await gitExec(args, this.cwd);

    return output.replace(/\n*$/, '');
  }

  async currentCommit() {
    return await gitExec(['rev-parse', '--verify', 'HEAD']);
  }

  async cleanChangeLogs() {
    await gitExec(['clean', '-f', '**/CHANGELOG.md', 'CHANGELOG.md'], this.cwd);
    await gitExec(['checkout', 'CHANGELOG.md'], this.cwd);
    await gitExec(['checkout', '**/CHANGELOG.md'], this.cwd);
  }

  async platform(): Promise<IGitPlatform> {
    const branchOutput = await gitExec(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], this.cwd);
    const [origin] = branchOutput.trim().split('/');

    const gitUrl = await gitExec(['config', '--get', `remote.${origin}.url`], this.cwd);
    if (gitUrl.includes('github.com')) {
      return new Github();
    }
    return new Generic();
  }
}
