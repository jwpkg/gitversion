import { NodeProject } from './node-project';
import { NpmPlugin } from './npm';
import { PNpmPlugin } from './pnpm';
import { YarnBerryPlugin } from './yarn';

export * from './node-project';
export * from './npm';
export * from './pnpm';
export * from './yarn';

export const nodePlugins = [
  NodeProject,
  NpmPlugin,
  PNpmPlugin,
  YarnBerryPlugin,
];
