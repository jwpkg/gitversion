import { runExit } from 'clipanion';

import { BumpCommand } from './commands/bump';
import { CheckCommand } from './commands/check';
import { GitBumpContext } from './commands/context';
import { PackCommand } from './commands/pack';
import { PublishCommand } from './commands/publish';
import { ResetCommand } from './commands/reset';
import { RestoreCommand } from './commands/restore';


runExit<GitBumpContext>([
  BumpCommand,
  ResetCommand,
  RestoreCommand,
  PackCommand,
  PublishCommand,
  CheckCommand,
], {});
