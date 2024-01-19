import { parse } from 'semver';

import { VersionBranchMock } from '../test/version-branch';

import { BumpType, detectBumpType, executeBump } from './bump-utils';
import { ConventionalCommit } from './conventional-commmit-utils';

function cc(commit: Partial<ConventionalCommit>): ConventionalCommit {
  return {
    body: '',
    breaking: false,
    type: 'fix',
    message: '',
    footers: [],
    hash: '',
    shortHash: '',
    ...commit,
  };
}

describe('Bump utils', () => {
  describe('Detect bump type', () => {
    test('Detect breaking', () => {
      const commits: ConventionalCommit[] = [
        cc({ type: 'docs' }),
        cc({ breaking: true }),
        cc({ type: 'feat' }),
      ];
      expect(detectBumpType(commits)).toBe(BumpType.MAJOR);
    });

    test('Detect highest', () => {
      const commits: ConventionalCommit[] = [
        cc({ type: 'docs' }),
        cc({ type: 'feat' }),
        cc({ type: 'fix' }),
      ];
      expect(detectBumpType(commits)).toBe(BumpType.MINOR);
    });
  });

  describe('Execut bump', () => {
    test('No bump needed', () => {
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.main(), BumpType.NONE)).toBeNull();
    });

    test('Bump normal releases', () => {
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.main(), BumpType.MAJOR)).toBe('2.0.0');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.main(), BumpType.MINOR)).toBe('1.1.0');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.main(), BumpType.PATCH)).toBe('1.0.1');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.main(), BumpType.GRADUATE)).toBe('2.0.0');
    });

    test('Bump developer releases 0.x.x', () => {
      expect(executeBump(parse('0.1.0')!, VersionBranchMock.main(), BumpType.MAJOR)).toBe('0.2.0');
      expect(executeBump(parse('0.1.0')!, VersionBranchMock.main(), BumpType.MINOR)).toBe('0.1.1');
      expect(executeBump(parse('0.1.0')!, VersionBranchMock.main(), BumpType.PATCH)).toBe('0.1.1');
      expect(executeBump(parse('0.1.0')!, VersionBranchMock.main(), BumpType.GRADUATE)).toBe('1.0.0');
    });

    test('Bump pre releases', () => {
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.feature('alpha'), BumpType.MAJOR)).toBe('2.0.0-alpha.0');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.feature('alpha'), BumpType.MINOR)).toBe('1.1.0-alpha.0');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.feature('feat1'), BumpType.PATCH)).toBe('1.0.1-feat1.0');
      expect(executeBump(parse('1.0.0')!, VersionBranchMock.feature('feat1'), BumpType.GRADUATE)).toBe('2.0.0-feat1.0');

      expect(executeBump(parse('1.0.0-alpha.1')!, VersionBranchMock.release('alpha'), BumpType.MAJOR)).toBe('1.0.0-alpha.2');
      expect(executeBump(parse('1.1.0-alpha.0')!, VersionBranchMock.release('alpha'), BumpType.MINOR)).toBe('1.1.0-alpha.1');
      expect(executeBump(parse('1.0.0-feat1.0')!, VersionBranchMock.release('feat1'), BumpType.PATCH)).toBe('1.0.0-feat1.1');
      expect(executeBump(parse('1.0.0-feat1.0')!, VersionBranchMock.release('feat1'), BumpType.GRADUATE)).toBe('1.0.0-feat1.1');
    });
  });
});
