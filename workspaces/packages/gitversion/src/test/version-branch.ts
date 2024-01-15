import { BranchType, VersionBranch } from '../config';

export class VersionBranchMock {
  static main(): VersionBranch {
    return {
      name: 'main',
      type: BranchType.MAIN,
    };
  }

  static unknown(): VersionBranch {
    return {
      name: 'unknown',
      type: BranchType.UNKNOWN,
    };
  }

  static feature(name: string): VersionBranch {
    return {
      name,
      type: BranchType.FEATURE,
    };
  }

  static release(name: string): VersionBranch {
    return {
      name,
      type: BranchType.RELEASE,
    };
  }
}
