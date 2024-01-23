import { run } from 'clipanion';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { BumpCommand } from './commands/bump';
import { PackCommand } from './commands/pack';
import { PublishCommand } from './commands/publish';
import { ResetCommand } from './commands/reset';
import { RestoreCommand } from './commands/restore';
import { formatDuration } from './utils/format-utils';
import { logger } from './utils/log-reporter';


const start = Date.now();
const isHelp = process.argv.includes('-h') || process.argv.includes('--help');
if (!isHelp) {
  const version = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8')).version;
  logger.reportHeader(`Gitversion ${version}`);
}

run([
  BumpCommand,
  ResetCommand,
  RestoreCommand,
  PackCommand,
  PublishCommand,
], {
  logger,
}).then(result => {
  process.exitCode = result;
  if (!isHelp) {
    if (result === 0) {
      logger.reportInfo(`Done in ${formatDuration(Date.now() - start)}`);
    } else {
      logger.reportInfo(`Done with errors in ${formatDuration(Date.now() - start)}`);
    }
  }
});
