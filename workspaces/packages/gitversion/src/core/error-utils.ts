import { Executor } from './executor';
import { Git } from './git';
import { LogReporter } from './log-reporter';

export class UnexpectedError extends Error {
}

export function debugEnvironment(logger: LogReporter) {
  const envSection = logger.beginSection('[Current Environment Variables]');
  Object.entries(process.env).forEach(([k, v]) => {
    logger.reportInfo(`${k}: ${v}`);
  });
  logger.endSection(envSection);
}

export async function debugGitCommand(executor: Executor, logger: LogReporter, args: string[]) {
  const result = await executor.exec(['git', ...args]);
  const section = logger.beginSection(`>> git ${args.join(' ')}`);
  result.split('\n').forEach(l => {
    logger.reportInfo(l);
  });
  logger.endSection(section);
}


export async function debugGitCommands(logger: LogReporter) {
  const cwd = await Git.root();

  const executor = new Executor(cwd, logger);
  await debugGitCommand(executor, logger, ['rev-parse', '--show-toplevel']);
  await debugGitCommand(executor, logger, ['branch', '--show-current']);
  await debugGitCommand(executor, logger, ['rev-parse', '--revs-only', 'HEAD']);
  await debugGitCommand(executor, logger, ['status', '--porcelain']);
  await debugGitCommand(executor, logger, ['remote']);
}
