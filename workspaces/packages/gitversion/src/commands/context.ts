import { BaseContext, Command } from 'clipanion';

import { LogReporter } from '../utils/log-reporter';

export interface GitVersionContext extends BaseContext {
  logger: LogReporter;
}

export abstract class GitVersionCommand extends Command<GitVersionContext> {

}
