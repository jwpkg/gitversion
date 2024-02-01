import { AzureDevopsPlugin } from './azure-devops';

describe('Github platform', () => {
  test('Url parsing', () => {
    const github = new AzureDevopsPlugin();
    expect(github.parseUrl('https://aegon-nl@dev.azure.com/aegon-nl/apidas/_git/apigee-monorepo')).toStrictEqual({
      organizationName: 'aegon-nl',
      projectName: 'apidas',
      repoName: 'apigee-monorepo',
    });

    expect(github.parseUrl('git@ssh.dev.azure.com:v3/aegon-nl/apidas/apigee-monorepo')).toStrictEqual({
      organizationName: 'aegon-nl',
      projectName: 'apidas',
      repoName: 'apigee-monorepo',
    });
  });
});
