import { ChangelogEntry, addToChangelog } from './changelog';

describe('Changelog', () => {
  test('Add to changelog', () => {
    const current = '# test\n\n## [1.0.0] version\n\n-feat: test';
    const entry: ChangelogEntry = {
      headerLine: '## [1.0.1] version',
      body: 'bla bla',
      version: '1.0.1',
    };
    expect(addToChangelog(entry, current)).toBe(`
# Changelog

All notable changes to this project will be documented in this file


## [1.0.1] version

bla bla

## [1.0.0] version

-feat: test
`);
  });

  test('Add to changelog- replace', () => {
    const current = '# test\n\n## [1.0.0] version\n\n-feat: test';
    const entry: ChangelogEntry = {
      headerLine: '## [1.0.0] version',
      body: 'bla bla',
      version: '1.0.0',
    };
    expect(addToChangelog(entry, current)).toBe(`
# Changelog

All notable changes to this project will be documented in this file


## [1.0.0] version

bla bla
`);
  });
});
