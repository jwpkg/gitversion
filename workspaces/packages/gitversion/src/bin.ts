import { runExit } from 'clipanion';

import { BumpCommand } from './commands/bump';
import { CheckCommand } from './commands/check';
import { GitVersionContext } from './commands/context';
import { PackCommand } from './commands/pack';
import { PublishCommand } from './commands/publish';
import { ResetCommand } from './commands/reset';
import { RestoreCommand } from './commands/restore';
import { TagCommand } from './commands/tag';


runExit<GitVersionContext>([
  BumpCommand,
  ResetCommand,
  RestoreCommand,
  PackCommand,
  PublishCommand,
  CheckCommand,
  TagCommand,
], {});
