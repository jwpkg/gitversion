import { AzureDevopsPlugin } from './azure-devops';
import { GitPlatformDefault } from './default';
import { GithubPlugin } from './github';

export * from './github';
export * from './azure-devops';
export * from './default';

export const gitPlugins = [
  GithubPlugin,
  GitPlatformDefault,
  AzureDevopsPlugin,
];
