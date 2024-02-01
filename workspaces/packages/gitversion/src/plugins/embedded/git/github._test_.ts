import { GithubPlugin } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    const github = new GithubPlugin();
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
