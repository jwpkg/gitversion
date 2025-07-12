import { BumpType } from './bump-utils';
import { ChangelogEntry } from './changelog';
import { IConfiguration, VersionBranch } from './configuration';
import { formatPackageName, formatVersion } from './format-utils';
import { LogReporter } from './log-reporter';
import { IGitPlatform } from './plugin-manager';

export interface IManifest {
  name: string;
  version?: string;
  private?: boolean;
}

export interface IWorkspace {
  readonly manifest: IManifest;

  readonly relativeCwd: string;

  readonly cwd: string;

  readonly version: string;

  readonly private: boolean;

  readonly packageName: string;

  readonly project: IProject;

  readonly tagPrefix: string;

  updateChangelog(entry: ChangelogEntry): Promise<string>;
  updateVersion(version: string): Promise<void>;

  detectBumpType(configuration: IConfiguration, versionBranch: VersionBranch, gitPlatform: IGitPlatform, logger?: LogReporter): Promise<BumpType>;
}

export interface IProject extends IWorkspace {
  readonly childWorkspaces: IWorkspace[];

  readonly workspaces: IWorkspace[];
}

export async function updateWorkspaceVersion(workspace: IWorkspace, logger: LogReporter, version: string) {
  logger.reportInfo(`Update package ${formatPackageName(workspace.packageName)} to version ${formatVersion(version)}`);
  workspace.updateVersion(version);
}
