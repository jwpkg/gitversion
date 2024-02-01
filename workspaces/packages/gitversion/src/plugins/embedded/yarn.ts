import { existsSync } from 'fs';
import { join } from 'path';

import { IProject } from '../../core/workspace-utils';
import { IIntializablePlugin, IPlugin } from '..';

export class YarnPlugin implements IPlugin, IIntializablePlugin {
  name = 'Yarn package manager plugin';

  initialize(project: IProject): boolean | Promise<boolean> {
    return existsSync(join(project.cwd, 'yarn.lock'));
  }
}
