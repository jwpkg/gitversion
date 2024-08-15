import { RequiredConfigurationOption } from './configuration';

export const DEFAULT_PACKAGE_VERSION = '0.0.0';

export const DEFAULT_CONFIGURATION_OPTIONS: RequiredConfigurationOption = {
  featureBranchPatterns: [
    '^feature/(.*)$',
    '^bugfix/(.*)$',
    '^hotfix/(.*)$',
  ],
  releaseBranchPatterns: [
    '^release/(.*)$',
  ],
  mainBranchPatterns: [
    '^(main)$',
    '^(master)$',
  ],
  independentVersioning: false,
  versionTagPrefix: 'v',
  dryRun: false,
  featureBumpBehavior: 'never',
  featurePushChangelogs: false,
  gitFlags: {},
};
