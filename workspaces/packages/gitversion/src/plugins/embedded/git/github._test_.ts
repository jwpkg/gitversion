import { GithubPlugin } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    expect(GithubPlugin.parseUrl('https://github.com/jwpkg/gitversion.git')).toStrictEqual({
      projectName: 'jwpkg',
      repoName: 'gitversion',
    });

    expect(GithubPlugin.parseUrl('git@github.com:jwpkg/gitversion.git')).toStrictEqual({
      projectName: 'jwpkg',
      repoName: 'gitversion',
    });
  });
});
