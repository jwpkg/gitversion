import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { createHash } from 'crypto';

const delim1 = 'E2B4D2F3-B7AF-4377-BF0F-D81F4E0723F3';
const delim2 = '25B7DA41-228B-4679-B2A2-86E328D3C3DE';
const endRegex = new RegExp(`${delim2}\\r?\\n?$`);

export interface GitCommit {
  message: string;
  date: Date;
  hash: string;
}

export interface GitTag {
  tagName: string;
  hash?: string;
}

async function gitExec(args: string[], cwd?: string) {
  // console.log('>>', 'git', ...args);
  const output = await crossSpawnAsync('git', args, {
    cwd,
  });
  if (output.error) {
    throw output.error;
  }
  if (output.exitCode !== 0) {
    console.log(output.stderr.toString());
    console.log(output.stdout.toString());
    throw new Error(`Invalid status code from git output: ${output.exitCode}`);
  }
  return output.stdout
    .toString()
    .replace(/\\r?\\n?$/, '')
    .trim();
}

export class Git {
  private commandCache: Map<string, string> = new Map();

  static async root(): Promise<string> {
    return gitExec(['rev-parse', '--show-toplevel']);
  }

  constructor(private cwd: string) {
  }

  async exec(...args: string[]) {
    return gitExec(args, this.cwd);
  }

  async logs(sinceHash?: string, relativeCwd?: string): Promise<GitCommit[]> {
    const formatFlag = `--format=format:%s${delim1}%cI${delim1}%H${delim1}%b${delim2}`;

    const parseEntry = (entry?: string): GitCommit | undefined => {
      if (entry && entry.length > 0) {
        const [subject, date, hash, body] = entry.split(delim1);

        return {
          message: `${subject.trim()}\n\n${body.trim()}`,
          date: new Date(date),
          hash: hash.trim(),
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

    const output = await this.exec(...args);

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
      'tag',
      '--list',
      '--merged=HEAD',
      `--format=%(objectname)${delim1}%(refname:strip=2)${delim2}`,
      prefixFilter,
    ];

    const output = await this.exec(...args);

    const tags = output
      .replace(endRegex, '')
      .split(delim2)
      .map(parseEntry)
      .filter(e => e !== undefined)
      .map(e => e as GitTag);

    return tags;
  }

  async addTag(tag: string, message: string) {
    await this.exec('tag', '-a', tag, '-m', message);
  }

  async addAndCommitFiles(message: string, files: string[]) {
    await this.exec('add', ...files);
    await this.exec('commit', '-m', `${message} [skip ci]`, '--', ...files);
  }


  async push() {
    await this.exec('push', 'origin', '--follow-tags');
  }

  async currentBranch() {
    // azure devops lookup
    if (process.env.BUILD_SOURCEBRANCHNAME) {
      return process.env.BUILD_SOURCEBRANCHNAME;
    }

    const output = await this.exec('rev-parse', '--abbrev-ref', 'HEAD');

    return output.replace(/\n*$/, '');
  }

  async gitStatusHash() {
    const commit = await this.exec('rev-parse', '--revs-only', 'HEAD');
    const status = await this.exec('status', '--porcelain');

    const cleanedStatus = status.split('\n').filter(l => {
      return !(l.includes('package.json') || l.includes('CHANGELOG.md'));
    }).join('\n');

    const hash = createHash('sha256');
    hash.update(commit);
    hash.update(cleanedStatus);
    return hash.digest().toString('base64');
  }

  async currentCommit() {
    return await this.exec('rev-parse', '--verify', 'HEAD');
  }

  async cleanChangeLogs() {
    await this.exec('clean', '-f', '**/CHANGELOG.md', 'CHANGELOG.md');
    await this.exec('checkout', 'CHANGELOG.md');
    await this.exec('checkout', '**/CHANGELOG.md');
  }

  async remoteName() {
    const result = this.commandCache.get('remote_name');
    if (result) {
      return result;
    }

    const remotes = (await this.exec('remote')).split('\n');
    if (remotes.length > 0) {
      this.commandCache.set('remote_name', remotes[0]);
      return remotes[0];
    }
    throw new Error('Invalid git, currently can\'t work with multiple remotes');
  }

  async remoteUrl() {
    const result = this.commandCache.get('remote_url');
    if (result) {
      return result;
    }

    try {
      const remoteName = await this.remoteName();
      const result = await this.exec('config', '--get', `remote.${remoteName}.url`);
      if (result) {
        this.commandCache.set('remote_url', result);
      }
      return result;
    } catch {
      return null;
    }
  }
}
