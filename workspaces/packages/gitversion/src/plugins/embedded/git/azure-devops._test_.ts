import { AzureDevopsPlugin } from './azure-devops';

describe('Github platform', () => {
  test('Url parsing', () => {
    expect(AzureDevopsPlugin.parseUrl('https://username@dev.azure.com/organizationname/projectname/_git/reponame')).toStrictEqual({
      organizationName: 'organizationname',
      projectName: 'projectname',
      repoName: 'reponame',
    });

    expect(AzureDevopsPlugin.parseUrl('git@ssh.dev.azure.com:v3/organizationname/projectname/reponame')).toStrictEqual({
      organizationName: 'organizationname',
      projectName: 'projectname',
      repoName: 'reponame',
    });
  });
});
