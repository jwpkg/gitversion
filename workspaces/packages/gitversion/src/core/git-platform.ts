import { ChangeLogUrls } from './changelog';
import { GitCommit } from './git';
import { GitSemverTag } from './version-utils';

export interface IGitPlatform extends ChangeLogUrls {
  stripMergeMessage(commit: GitCommit): GitCommit;
}

export class Generic implements IGitPlatform {
  stripMergeMessage(commit: GitCommit): GitCommit {
    return commit;
  }

  compareUrl(from: GitSemverTag, to: GitSemverTag) {
    return `https://github.com/cp-utils/gitversion/compare/${from.version}...${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://github.com/cp-utils/gitversion/commit/${commit}`;
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

  compareUrl(from: GitSemverTag, to: GitSemverTag) {
    return `https://github.com/cp-utils/gitversion/compare/${from.version}...${to.version}`;
  }

  commitUrl(commit: string) {
    return `https://github.com/cp-utils/gitversion/commit/${commit}`;
  }
}
