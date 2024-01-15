import { GitCommit } from './git';

export interface IGitPlatform {
  stripMergeMessage(commit: GitCommit): GitCommit;
}

export class Generic implements IGitPlatform {
  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }
}

export class Github implements IGitPlatform {
  stripMergeMessage(commit: GitCommit): GitCommit {
    if (commit.subject.startsWith('Merge pull request ')) {
      const lines = commit.body.split('\n');
      const subject = lines.splice(0, 1)[0];
      const body = lines.join('\n').trim();
      return {
        ...commit,
        subject,
        body,
      };
    } else {
      return commit;
    }
  }
}
