import { error } from 'console';
import { async as crossSpawnAsync } from 'cross-spawn-extra';
import { stdout } from 'process';

import { LogReporter } from './log-reporter';

export interface IExecutorExecOptions {
  normalizeOutput?: boolean;
  cwd?: string;
  silent?: boolean;
  echo?: boolean;
}

export interface IExecutor {
  exec(commandAndArgs: string[], options?: IExecutorExecOptions): Promise<string>;
}

export class Executor implements IExecutor {
  constructor(private cwd: string, private logger: LogReporter) { }

  async exec(commandAndArgs: string[], options?: IExecutorExecOptions | undefined): Promise<string> {
    const result = await crossSpawnAsync(commandAndArgs[0], commandAndArgs.splice(1), {
      cwd: options?.cwd ?? this.cwd,
      env: process.env,
    });

    if (result.error) {
      this.logError(`${result.error}`);
      throw error;
    }
    if (result.exitCode !== 0) {
      this.logError(`Executing command non-zero exit code: ${result.exitCode}`);
      this.logError(`Executed command: [${commandAndArgs.join(' ')}]`);
      this.logError(`Error output: ${result.output.toString()}`);
      throw new Error('Non-zero exitcode');
    }

    if (options?.normalizeOutput === false) {
      return stdout.toString();
    } else {
      return result.stdout
        .toString()
        .replace(/\\r?\\n?$/, '')
        .trim();
    }
  }

  logError(message: string, options?: IExecutorExecOptions) {
    if (options?.silent !== false) {
      this.logger.reportError(message);
    }
  }
}
