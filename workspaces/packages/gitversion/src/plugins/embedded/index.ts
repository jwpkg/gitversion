import { gitPlugins } from './git';
import { nodePlugins } from './node';

export * from './git';
export * from './node';

export const embeddedPlugins = [
  ...gitPlugins,
  ...nodePlugins,
];
