import { BaseContext, Command } from 'clipanion';

import { IApplication } from '../core/application';

export interface GitVersionContext extends BaseContext {
  application?: IApplication;
}

export abstract class GitVersionCommand extends Command<GitVersionContext> {

}
