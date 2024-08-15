import { GithubPlugin } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    expect(GithubPlugin.parseUrl('https://github.com/jwpkg/gitbump.git')).toStrictEqual({
      projectName: 'jwpkg',
      repoName: 'gitbump',
    });

    expect(GithubPlugin.parseUrl('git@github.com:jwpkg/gitbump.git')).toStrictEqual({
      projectName: 'jwpkg',
      repoName: 'gitbump',
    });
  });
});
