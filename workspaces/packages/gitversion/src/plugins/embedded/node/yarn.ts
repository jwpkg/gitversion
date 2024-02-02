import { existsSync } from 'fs';
import { join } from 'path';

import { IBaseConfiguration } from '../../../core/configuration';
import { IPlugin } from '../..';

export class YarnPlugin implements IPlugin {
  name = 'Yarn package manager plugin';

  static initialize(configuration: IBaseConfiguration) {
    if (existsSync(join(configuration.cwd, 'yarn.lock'))) {
      return new YarnPlugin();
    }
    return null;
  }
}
