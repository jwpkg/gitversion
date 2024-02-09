import { createHash } from 'crypto';

import { Executor } from './executor';
import { LogReporter } from './log-reporter';

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

export class Git {
  private commandCache: Map<string, string> = new Map();

  static async root(): Promise<string> {
    const executor = new Executor(process.cwd(), new LogReporter());
    return executor.exec(['git', 'rev-parse', '--show-toplevel']);
  }

  constructor(private cwd: string, private dryRun: boolean, private logger: LogReporter, private executor: Executor) {
  }

  async exec(...args: string[]) {
    return this.executor.exec(['git', ...args], {
      cwd: this.cwd,
    });
  }

  async execSilent(...args: string[]) {
    try {
      return await this.executor.exec(['git', ...args], {
        silent: true,
        cwd: this.cwd,
      });
    } catch (_error) {
      return null;
    }
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
    if (this.dryRun) {
      this.logger.reportDryrun(`Would be adding git tag '${tag}' with message '${message}'`);
      return;
    } else {
      await this.exec('tag', '-a', tag, '-m', message);
    }
  }

  async addAndCommitFiles(message: string, files: string[]) {
    if (this.dryRun) {
      this.logger.reportDryrun(`Would be adding files to git: \n${files.map(f => `    - ${f}`).join('\n')}`);
      this.logger.reportDryrun(`Would commit added files to git with message: '${message}'`);
      return;
    } else {
      await this.exec('add', ...files);
      await this.exec('commit', '-m', `${message} [skip ci]`, '--', ...files);
    }
  }


  async push() {
    const remoteName = await this.remoteName();

    if (remoteName) {
      if (this.dryRun) {
        this.logger.reportDryrun(`Would be pushing git to remote: '${remoteName}'`);
      } else {
        await this.exec('push', remoteName, '--follow-tags');
      }
    } else {
      this.logger.reportWarning('No remote found, can\'t push changes');
    }
  }

  async currentBranch() {
    return await this.execSilent('branch', '--show-current');
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
    await this.execSilent('clean', '-f', '**/CHANGELOG.md', 'CHANGELOG.md');
    await this.execSilent('checkout', 'CHANGELOG.md');
    await this.execSilent('checkout', '**/CHANGELOG.md');
  }

  async remoteName(): Promise<string | null> {
    const result = this.commandCache.get('remote_name');
    if (result) {
      return result;
    }

    const gitRemotes = await this.execSilent('remote');
    if (!gitRemotes) return null;

    const remotes = gitRemotes.split('\n');
    if (remotes.length > 0) {
      this.commandCache.set('remote_name', remotes[0]);
      return remotes[0];
    }
    throw new Error('Invalid git, currently can\'t work with multiple remotes');
  }

  async remoteUrl(): Promise<string | null> {
    const result = this.commandCache.get('remote_url');
    if (result) {
      return result;
    }

    try {
      const remoteName = await this.remoteName();
      if (!remoteName) return null;

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
