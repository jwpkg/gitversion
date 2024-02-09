import { FeatureBumpBehavior, RequiredConfigurationOption } from './configuration';

export const DEFAULT_PACKAGE_VERSION = '0.0.0';

export const DEFAULT_CONFIGURATION_OPTIONS: RequiredConfigurationOption = {
  featureBranchPatterns: [
    '^feature/(.*)$',
  ],
  releaseBranchPatterns: [
    '^release/(.*)$',
  ],
  mainBranchPattern: '^(main|master)$',
  independentVersioning: false,
  versionTagPrefix: 'v',
  dryRun: false,
  featureBumpBehavior: FeatureBumpBehavior.Normal,
};
