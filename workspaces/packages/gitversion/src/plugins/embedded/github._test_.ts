import { Github } from './github';

describe('Github platform', () => {
  test('Url parsing', () => {
    const github = new Github();
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
