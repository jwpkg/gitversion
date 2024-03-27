import { Application } from './application';
import { BranchType, BaseConfigurationOptions } from './configuration';

const defaultConfig: Required<BaseConfigurationOptions> = {
  featureBranchPatterns: [
    '^feature/(.*)$',
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
  gitFlags: {},
};

describe('configuration', () => {
  describe('Branch detection', () => {
    test('Main branch', () => {
      const result = Application.detectVersionBranch(defaultConfig, 'main');
      expect(result.name).toBe('main');
      expect(result.type).toBe(BranchType.MAIN);
    });

    test('Feature branch', () => {
      const result = Application.detectVersionBranch(defaultConfig, 'feature/new-feature');
      expect(result.name).toBe('new-feature');
      expect(result.type).toBe(BranchType.FEATURE);
    });

    test('Custom Feature branch', () => {
      const config = {
        ...defaultConfig,
        featureBranchPatterns: [
          '^prefix1-(.*)$',
          '^prefix2-(.*)$',
        ],
      };
      const result1 = Application.detectVersionBranch(config, 'prefix1-new-feature');
      expect(result1.name).toBe('new-feature');
      expect(result1.type).toBe(BranchType.FEATURE);

      const result2 = Application.detectVersionBranch(config, 'prefix2-new-feature2');
      expect(result2.name).toBe('new-feature2');
      expect(result2.type).toBe(BranchType.FEATURE);

      const result3 = Application.detectVersionBranch(config, 'feature/new-feature');
      expect(result3.name).toBe('unknown');
      expect(result3.type).toBe(BranchType.UNKNOWN);
    });

    test('Release branch', () => {
      const result = Application.detectVersionBranch(defaultConfig, 'release/alpha');
      expect(result.name).toBe('alpha');
      expect(result.type).toBe(BranchType.RELEASE);
    });

    test('Custom Release branch', () => {
      const config = {
        ...defaultConfig,
        releaseBranchPatterns: [
          '^(alpha)$',
          '^(node-[0-9]+)$',
        ],
      };
      const result1 = Application.detectVersionBranch(config, 'alpha');
      expect(result1.name).toBe('alpha');
      expect(result1.type).toBe(BranchType.RELEASE);

      const result2 = Application.detectVersionBranch(config, 'node-20');
      expect(result2.name).toBe('node-20');
      expect(result2.type).toBe(BranchType.RELEASE);

      const result3 = Application.detectVersionBranch(config, 'beta');
      expect(result3.name).toBe('unknown');
      expect(result3.type).toBe(BranchType.UNKNOWN);
    });
  });
});
