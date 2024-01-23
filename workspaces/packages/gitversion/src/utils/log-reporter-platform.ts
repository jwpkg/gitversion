import * as ci from 'ci-info';

export interface PlatformLogging {
  start?: (what: string) => string;
  end?: (what: string) => string;
  debug?: (message: string) => string;
  info?: (message: string) => string;
  warning?: (message: string) => string;
  error?: (message: string) => string;
}

export const PLATFORM: PlatformLogging | null = ci.GITHUB_ACTIONS ? {
  start: (what: string) => `::group::${what}\n`,
  end: (_what: string) => '::endgroup::\n',
  debug: (message: string) => `::debug::${message}`,
  info: (message: string) => `::notice::${message}`,
  warning: (message: string) => `::warning::${message}`,
  error: (message: string) => `::error::${message}`,
} : ci.TRAVIS ? {
  start: (what: string) => `travis_fold:start:${what}\n`,
  end: (what: string) => `travis_fold:end:${what}\n`,
} : ci.GITLAB ? {
  start: (what: string) => `section_start:${Math.floor(Date.now() / 1000)}:${what.toLowerCase().replace(/\W+/g, '_')}[collapsed=true]\r\x1b[0K${what}\n`,
  end: (what: string) => `section_end:${Math.floor(Date.now() / 1000)}:${what.toLowerCase().replace(/\W+/g, '_')}\r\x1b[0K`,
} : ci.AZURE_PIPELINES ? {
  start: (what: string) => `##[group]${what}\n`,
  end: (_what: string) => '##[endgroup]\n',
  error: (message: string) => `##vso[task.logissue type=error]${message}`,
  warning: (message: string) => `##vso[task.logissue type=warning]${message}`,
} : null;
