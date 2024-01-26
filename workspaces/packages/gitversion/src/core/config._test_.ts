import { BranchType, Configuration, BaseConfigurationOptions, FeatureBumpBehavior } from './config';

const defaultConfig: Required<BaseConfigurationOptions> = {
  featureBranchPatterns: [
    '^feature/(.*)$',
  ],
  releaseBranchPatterns: [
    '^release/(.*)$',
  ],
  mainBranch: 'main',
  independentVersioning: false,
  versionTagPrefix: 'v',
  featureBumpBehavior: FeatureBumpBehavior.AllCommits,
};

describe('configuration', () => {
  describe('Branch detection', () => {
    test('Main branch', () => {
      const result = Configuration.detectVersionBranch(defaultConfig, 'main');
      expect(result.name).toBe('main');
      expect(result.type).toBe(BranchType.MAIN);
    });

    test('Feature branch', () => {
      const result = Configuration.detectVersionBranch(defaultConfig, 'feature/new-feature');
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
      const result1 = Configuration.detectVersionBranch(config, 'prefix1-new-feature');
      expect(result1.name).toBe('new-feature');
      expect(result1.type).toBe(BranchType.FEATURE);

      const result2 = Configuration.detectVersionBranch(config, 'prefix2-new-feature2');
      expect(result2.name).toBe('new-feature2');
      expect(result2.type).toBe(BranchType.FEATURE);

      const result3 = Configuration.detectVersionBranch(config, 'feature/new-feature');
      expect(result3.name).toBe('unknown');
      expect(result3.type).toBe(BranchType.UNKNOWN);
    });

    test('Release branch', () => {
      const result = Configuration.detectVersionBranch(defaultConfig, 'release/alpha');
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
      const result1 = Configuration.detectVersionBranch(config, 'alpha');
      expect(result1.name).toBe('alpha');
      expect(result1.type).toBe(BranchType.RELEASE);

      const result2 = Configuration.detectVersionBranch(config, 'node-20');
      expect(result2.name).toBe('node-20');
      expect(result2.type).toBe(BranchType.RELEASE);

      const result3 = Configuration.detectVersionBranch(config, 'beta');
      expect(result3.name).toBe('unknown');
      expect(result3.type).toBe(BranchType.UNKNOWN);
    });
  });
});
