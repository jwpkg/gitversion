import { GithubPlugin } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    expect(GithubPlugin.parseUrl('https://github.com/cp-utils/gitversion.git')).toStrictEqual({
      projectName: 'cp-utils',
      repoName: 'gitversion',
    });

    expect(GithubPlugin.parseUrl('git@github.com:cp-utils/gitversion.git')).toStrictEqual({
      projectName: 'cp-utils',
      repoName: 'gitversion',
    });
  });
});
