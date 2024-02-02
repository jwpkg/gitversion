import { AzureDevopsPlugin } from './azure-devops';

describe('Github platform', () => {
  test('Url parsing', () => {
    expect(AzureDevopsPlugin.parseUrl('https://aegon-nl@dev.azure.com/aegon-nl/apidas/_git/apigee-monorepo')).toStrictEqual({
      organizationName: 'aegon-nl',
      projectName: 'apidas',
      repoName: 'apigee-monorepo',
    });

    expect(AzureDevopsPlugin.parseUrl('git@ssh.dev.azure.com:v3/aegon-nl/apidas/apigee-monorepo')).toStrictEqual({
      organizationName: 'aegon-nl',
      projectName: 'apidas',
      repoName: 'apigee-monorepo',
    });
  });
});
