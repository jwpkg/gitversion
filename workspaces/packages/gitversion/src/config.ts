import { Git } from './utils/git';

export interface ConfigurationOptions {
  featureBranchPatterns?: string[];
  releaseBranchPatterns?: string[];
  mainBranch?: string;
  independentVersioning?: boolean;
  versionTagPrefix?: string;
}

export enum BranchType {
  MAIN = 'main',
  RELEASE = 'release',
  FEATURE = 'feature',
  UNKNOWN = 'unknown',
}

export interface VersionBranch {
  readonly name: string;
  readonly type: BranchType;
}

export class Configuration {
  constructor(public options: ConfigurationOptions, public branch: VersionBranch) { }

  static detectVersionBranch(configOptions: Required<ConfigurationOptions>, branchName: string): VersionBranch {
    if (configOptions.mainBranch === branchName) {
      return {
        type: BranchType.MAIN,
        name: branchName,
      };
    }

    const featureBranchPatterns = configOptions.featureBranchPatterns.map(pattern => new RegExp(pattern));
    for (const branchPattern of featureBranchPatterns) {
      if (branchPattern.test(branchName)) {
        const matches = branchPattern.exec(branchName);

        if (matches && matches.length === 2) {
          return {
            name: matches[1],
            type: BranchType.FEATURE,
          };
        } else {
          throw new Error(`The feature pattern '${branchPattern.source}' matched the current branch but it should result in exact 1 group match`);
        }
      }
    }

    const releaseBranchPatterns = configOptions.releaseBranchPatterns.map(pattern => new RegExp(pattern));
    for (const branchPattern of releaseBranchPatterns) {
      if (branchPattern.test(branchName)) {
        const matches = branchPattern.exec(branchName);

        if (matches && matches.length === 2) {
          return {
            name: matches[1],
            type: BranchType.RELEASE,
          };
        } else {
          throw new Error(`The release pattern '${branchPattern.source}' matched the current branch but it should result in exact 1 group match`);
        }
      }
    }

    return {
      name: 'unknown',
      type: BranchType.UNKNOWN,
    };
  }

  static async load(cwd: string): Promise<Configuration> {
    const options: Required<ConfigurationOptions> = {
      featureBranchPatterns: [
        '^feature/(.*)$',
      ],
      releaseBranchPatterns: [
        '^release/(.*)$',
      ],
      mainBranch: 'main',
      independentVersioning: false,
      versionTagPrefix: 'v',
    };

    const git = new Git(cwd);
    const branch = this.detectVersionBranch(options, await git.currentBranch());
    //TODO: load from file
    return new Configuration(options, branch);
  }
}
