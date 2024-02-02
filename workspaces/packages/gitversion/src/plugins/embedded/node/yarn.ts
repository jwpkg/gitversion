import { existsSync } from 'fs';
import { join } from 'path';

import { IBaseConfiguration } from '../../../core/configuration';
import { IIntializablePlugin, IPlugin } from '../..';

export class YarnPlugin implements IPlugin, IIntializablePlugin {
  name = 'Yarn package manager plugin';

  initialize(configuration: IBaseConfiguration): boolean | Promise<boolean> {
    return existsSync(join(configuration.cwd, 'yarn.lock'));
  }
}
