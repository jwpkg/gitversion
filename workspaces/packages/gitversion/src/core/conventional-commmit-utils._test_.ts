import { ConventionalCommitFooterType, parseConventionalCommit } from './conventional-commmit-utils';
import { GitCommit } from './git';

function commit(message: string): GitCommit {
  const lines = message.split('\n');
  const subject = lines.splice(0, 1).join('\n').trim();
  const body = lines.join('\n').trim();
  return {
    body,
    subject,
    date: new Date(),
    hash: 'abcd',
  };
}

describe('Conventional commit parsing', () => {
  test('Parse simple headers', () => {
    const result = parseConventionalCommit(commit('feat: testFeat 1'));
    expect(result).toMatchObject({
      type: 'feat',
      message: 'testFeat 1',
    });
  });

  test('Parse scoped headers', () => {
    const result = parseConventionalCommit(commit('feat(core): testFeat 1'));
    expect(result).toMatchObject({
      type: 'feat',
      message: 'testFeat 1',
      scope: 'core',
    });
  });

  test('Parse breaking headers', () => {
    const result = parseConventionalCommit(commit('feat!: testFeat 1'));
    expect(result).toMatchObject({
      type: 'feat',
      message: 'testFeat 1',
      breaking: true,
    });
  });

  test('Parse breaking scoped headers', () => {
    const result = parseConventionalCommit(commit('feat(core)!: testFeat 1'));
    expect(result).toMatchObject({
      type: 'feat',
      message: 'testFeat 1',
      breaking: true,
      scope: 'core',
    });
  });

  test('Should not accept non-conventional commit messages', () => {
    expect(parseConventionalCommit(commit('feat(core)! testFeat 1'))).toBeUndefined();
    expect(parseConventionalCommit(commit('feat(core!: testFeat 1'))).toBeUndefined();
    expect(parseConventionalCommit(commit('feat!(core) testFeat 1'))).toBeUndefined();
    expect(parseConventionalCommit(commit('feat(core):'))).toBeUndefined();
    expect(parseConventionalCommit(commit('(core)! testFeat 1'))).toBeUndefined();
  });

  test('Should parse body', () => {
    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nBODY TEXT!!!\nHello world'))).toMatchObject({
      body: 'BODY TEXT!!!\nHello world',
    });

    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nBODY TEXT!!!\nHello world\n\nTesting: Hello footer'))).toMatchObject({
      body: 'BODY TEXT!!!\nHello world',
    });

    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nBODY TEXT!!!\nHello world\n\nBREAKING CHANGE: Hello breaking'))).toMatchObject({
      body: 'BODY TEXT!!!\nHello world',
    });

    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nBODY TEXT!!!\nHello world\n\nFixes #12345'))).toMatchObject({
      body: 'BODY TEXT!!!\nHello world',
    });
  });

  test('Should parse footers', () => {
    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nBODY TEXT!!!\nHello world\n\nTesting: Hello footer'))).toMatchObject({
      footers: [{
        type: ConventionalCommitFooterType.note,
        name: 'Testing',
        value: 'Hello footer',
      }],
    });

    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nTesting: Hello footer'))).toMatchObject({
      footers: [{
        type: ConventionalCommitFooterType.note,
        name: 'Testing',
        value: 'Hello footer',
      }],
    });

    expect(parseConventionalCommit(commit('feat(core)!: testFeat 1\n\nFixes #12345\nFixes #12346\nFixes #12347'))).toMatchObject({
      footers: [{
        type: ConventionalCommitFooterType.ref,
        name: 'Fixes',
        value: '12345',
      }, {
        type: ConventionalCommitFooterType.ref,
        name: 'Fixes',
        value: '12346',
      }, {
        type: ConventionalCommitFooterType.ref,
        name: 'Fixes',
        value: '12347',
      }],
    });

    expect(parseConventionalCommit(commit('feat(core): testFeat 1\n\nBREAKING CHANGE: This footer breaks'))).toMatchObject({
      breaking: true,
      breakingReason: 'This footer breaks',
      footers: [],
    });
  });
});
