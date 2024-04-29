import { Cli } from 'clipanion';

import { BumpCommand } from './commands/bump';
import { CheckCommand } from './commands/check';
import { PackCommand } from './commands/pack';
import { PublishCommand } from './commands/publish';
import { ResetCommand } from './commands/reset';
import { RestoreCommand } from './commands/restore';
import { UnexpectedError, debugEnvironment, debugGitCommands } from './core/error-utils';
import { LogReporter } from './core/log-reporter';

async function run() {
  const cli = new Cli();
  cli.register(BumpCommand);
  cli.register(ResetCommand);
  cli.register(RestoreCommand);
  cli.register(PackCommand);
  cli.register(PublishCommand);
  cli.register(CheckCommand);

  try {
    await cli.process(process.argv.slice(2)).execute();
  } catch (error) {
    if (error instanceof UnexpectedError) {
      const logger = new LogReporter();
      const section = logger.beginSection('Debug info');
      debugEnvironment(logger);
      await debugGitCommands(logger);

      logger.endSection(section);
      logger.reportError(error.message, true);
    } else {
      process.stdout.write(cli.error(error));
    }
    process.exitCode = 1;
  }
}

run();
