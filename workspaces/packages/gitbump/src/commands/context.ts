import { BaseContext, Command } from 'clipanion';

import { IApplication } from '../core/application';

export interface GitBumpContext extends BaseContext {
  application?: IApplication;
}

export abstract class GitBumpCommand extends Command<GitBumpContext> {

}
