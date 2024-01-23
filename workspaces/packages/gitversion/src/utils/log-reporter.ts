import { colorize } from 'colorize-node';
import { Writable } from 'stream';

import { formatDuration } from './format-utils';
import { PLATFORM } from './log-reporter-platform';

export type SyncSectionRunner = (logger: LogReporter) => void;
export type AsyncSectionRunner = (logger: LogReporter) => Promise<void>;

export enum CarotColor {
  White,
  Green,
  Blue,
  Yellow,
  Red,
}

export interface LogReporterOptions {
  stdout?: Writable;
  level?: number;
}

export const SINGLE_LINE_CHAR = '·';

export interface PlatformLogging {
  start?: (what: string) => string;
  end?: (what: string) => string;
  debug?: (message: string) => string;
  info?: (message: string) => string;
  warning?: (message: string) => string;
  error?: (message: string) => string;
}

export class LogReporter {
  stdout: Writable;
  level = 0;
  indent = 0;
  constructor(private options?: LogReporterOptions) {
    this.stdout = this.options?.stdout ?? process.stdout;

    if (options?.level) {
      this.level = options.level;
      this.indent = options.level;
    }
  }

  runSectionSync(title: string, runner: SyncSectionRunner) {
    const section = this.beginSection(title);
    runner(this);
    this.endSection(section);
  }

  async runSection(title: string, runner: AsyncSectionRunner) {
    let buffer = '';
    const logger = new LogReporter({
      level: this.level + 1,
      stdout: new Writable({
        write: (chunk, _encoding, next) => {
          buffer = buffer + chunk.toString();
          next();
        },
      }),
    });

    await runner(logger);
    const section = this.beginSection(title);

    this.stdout.write(buffer);

    this.endSection(section);
  }

  beginSection(title: string) {
    this.level += 1;

    this.reportInfo(`┌ ${title}`);
    this.indent += 1;

    if (PLATFORM?.start) {
      this.stdout.write(PLATFORM.start(title));
    }
    return {
      start: Date.now(),
      title,
    };
  }

  endSection({ title, start }: { title: string, start: number }) {
    const duration = start ? Date.now() - start : 0;
    if (PLATFORM?.end) {
      this.stdout.write(PLATFORM.end(title));
    }
    this.indent -= 1;
    if (duration > 200)
      this.reportInfo(`└ Completed in ${formatDuration(duration)}`);
    else
      this.reportInfo('└ Completed');
    this.level -= 1;
  }

  reportHeader(message: string) {
    this.writeLine(`${this.formatPrefix(CarotColor.White)}${colorize.bold(colorize.whiteBright(message))}`);
  }

  reportInfo(message: string) {
    this.writeLine(`${this.formatPrefix(CarotColor.Blue)}${message}`);
  }

  reportWarning(message: string, important: boolean = false) {
    this.writeLine(`${this.formatPrefix(CarotColor.Yellow)}${message}`);
    if (important) {
      PLATFORM?.warning?.(message);
    }
  }

  reportError(message: string, important: boolean = false) {
    this.writeLine(`${this.formatPrefix(CarotColor.Red)}[ERROR] ${message}`);
    if (important) {
      PLATFORM?.error?.(message);
    }
  }

  private formatPrefix(caretColor: CarotColor) {
    let caret = '➤';
    switch (caretColor) {
      case CarotColor.White: caret = colorize.whiteBright(caret); break;
      case CarotColor.Blue: caret = colorize.blueBright(caret); break;
      case CarotColor.Green: caret = colorize.greenBright(caret); break;
      case CarotColor.Red: caret = colorize.redBright(caret); break;
      case CarotColor.Yellow: caret = colorize.yellowBright(caret); break;
    }

    return `${caret} ${this.formatIndent()}`;
  }

  private formatIndent() {
    return this.level > 0 ? '│ '.repeat(this.indent) : `${SINGLE_LINE_CHAR} `;
  }

  writeLine(message: string) {
    this.stdout.write(`${message}\n`);
  }
}

export const logger = new LogReporter();
