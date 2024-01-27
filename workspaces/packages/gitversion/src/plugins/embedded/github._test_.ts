import { GithubPlatform } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    const github = new GithubPlatform();
    expect(github.parseUrl('https://github.com/cp-utils/gitversion.git')).toStrictEqual({
      projectName: 'cp-utils',
      repoName: 'gitversion',
    });

    expect(github.parseUrl('git@github.com:cp-utils/gitversion.git')).toStrictEqual({
      projectName: 'cp-utils',
      repoName: 'gitversion',
    });
  });
});
