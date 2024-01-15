import { parse } from 'semver';

import { VersionBranchMock } from '../test/version-branch';

import { tagPrefix } from './git-utils';
import { GitTag } from './git';
import { determineCurrentVersion } from './version-utils';

describe('Version utils', () => {
  describe('determineCurrentVersion', () => {
    const tagList: GitTag[] = [
      { hash: 'a', tagName: 'v0.1.0' },
      { hash: 'b', tagName: 'v@scope/package-0.1.0' },
      { hash: 'c', tagName: 'v0.0.2-alpha.1' },
      { hash: 'd', tagName: 'v@scope/package-0.0.2-alpha.1' },
      { hash: 'e', tagName: 'v0.0.2-alpha.0' },
      { hash: 'f', tagName: 'v@scope/package-0.0.2-alpha.0' },
      { hash: 'g', tagName: 'v0.0.3-feature2.1' },
      { hash: 'h', tagName: 'v@scope/package-0.0.3-feature2.1' },
      { hash: 'i', tagName: 'v0.0.3-feature2.0' },
      { hash: 'j', tagName: 'v@scope/package-0.0.3-feature2.0' },
      { hash: 'k', tagName: 'v0.0.2' },
      { hash: 'l', tagName: 'v@scope/package-0.0.2' },
      { hash: 'm', tagName: 'v0.0.1' },
      { hash: 'n', tagName: 'v@scope/package-0.0.1' },
    ];

    test('No version', () => {
      const result = determineCurrentVersion([], VersionBranchMock.main(), 'v');

      expect(result).toEqual({
        hash: '',
        version: parse('0.0.0'),
      });
    });

    test('Official versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.main(), 'v');

      expect(result).toEqual({
        hash: 'a',
        version: parse('0.1.0'),
      });
    });

    test('Official package based versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.main(), tagPrefix('v', '@scope/package'));

      expect(result).toEqual({
        hash: 'b',
        version: parse('0.1.0'),
      });
    });

    test('No release versions', () => {
      const tagList: GitTag[] = [
        { hash: 'g', tagName: 'v0.0.3-feature2.1' },
        { hash: 'k', tagName: 'v0.0.2' },
        { hash: 'm', tagName: 'v0.0.1' },
      ];

      const result = determineCurrentVersion(tagList, VersionBranchMock.release('alpha'), 'v');

      expect(result).toEqual({
        hash: 'k',
        version: parse('0.0.2'),
      });
    });

    test('Feature versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.feature('feature2'), 'v');

      expect(result).toEqual({
        hash: 'g',
        version: parse('0.0.3-feature2.1'),
      });
    });

    test('Release versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.release('alpha'), 'v');

      expect(result).toEqual({
        hash: 'c',
        version: parse('0.0.2-alpha.1'),
      });
    });

    test('Feature package versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.feature('feature2'), tagPrefix('v', '@scope/package'));

      expect(result).toEqual({
        hash: 'h',
        version: parse('0.0.3-feature2.1'),
      });
    });

    test('Release package versions', () => {
      const result = determineCurrentVersion(tagList, VersionBranchMock.release('alpha'), tagPrefix('v', '@scope/package'));

      expect(result).toEqual({
        hash: 'd',
        version: parse('0.0.2-alpha.1'),
      });
    });

    test('Unknown branches should throw', () => {
      expect(() => determineCurrentVersion(tagList, VersionBranchMock.unknown(), tagPrefix('v'))).toThrow();
    });
  });
});
