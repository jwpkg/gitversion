import { AzureDevopsPlugin } from './azure-devops';
import { GithubPlugin } from './github';

export * from './github';
export * from './azure-devops';
export * from './default';

export const gitPlugins = [
  GithubPlugin,
  AzureDevopsPlugin,
];
