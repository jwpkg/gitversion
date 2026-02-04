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
    const fullCommand = commandAndArgs.join(' ');

    // Check if running in CI without TTY
    const isCI = process.env.CI === 'true' ||
                 process.env.GITHUB_ACTIONS === 'true' ||
                 process.env.GITLAB_CI === 'true' ||
                 process.env.CIRCLECI === 'true' ||
                 process.env.TRAVIS === 'true' ||
                 process.env.JENKINS_URL !== undefined ||
                 process.env.BUILDKITE === 'true';

    const result = await crossSpawnAsync(commandAndArgs[0], commandAndArgs.splice(1), {
      cwd: options?.cwd ?? this.cwd,
      env: {
        ...process.env,
        // In CI, ensure npm doesn't try to be interactive
        ...(isCI && { npm_config_yes: 'true' }),
      },
    });

    if (result.error) {
      this.logError(`${result.error}`, options);
      throw error;
    }

    // Check for OTP prompts in stderr that indicate interactive input is needed
    const stderrOutput = result.stderr.toString();
    const stdoutOutput = result.stdout.toString();
    const combinedOutput = `${stderrOutput} ${stdoutOutput}`;

    if (isCI && !process.stdin.isTTY) {
      if (combinedOutput.includes('one-time password') ||
          combinedOutput.includes('One-time password') ||
          combinedOutput.includes('Enter OTP') ||
          /OTP/i.test(combinedOutput)) {
        this.logError('Detected OTP prompt in CI environment', options);
        this.logError(`Executed command: [${fullCommand}]`, options);
        this.logError(`Output: ${combinedOutput}`, options);
        throw new Error(
          'npm is requesting a one-time password (OTP) in a non-interactive CI environment.\n' +
          'This causes the build to hang indefinitely.\n\n' +
          'To fix this issue:\n' +
          '  1. Log in to npmjs.com and go to Access Tokens\n' +
          '  2. Generate a new "Automation" token (bypasses 2FA for CI/CD)\n' +
          '  3. Update your NPM_AUTH_TOKEN secret with the new automation token\n' +
          '  4. Do NOT use a "Publish" or "Classic" token type as they require OTP\n\n' +
          `Command: ${fullCommand}`,
        );
      }
    }

    if (result.exitCode !== 0) {
      this.logError(`Executing command non-zero exit code: ${result.exitCode}`, options);
      this.logError(`Executed command: [${fullCommand}]`, options);
      this.logError(`Error output: ${result.output.toString()}`, options);
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
    if (options?.silent !== true) {
      this.logger.reportError(message);
    }
  }
}
