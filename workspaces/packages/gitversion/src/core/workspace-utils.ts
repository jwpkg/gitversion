import { ChangelogEntry } from './changelog';
import { LogReporter } from './log-reporter';

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

  updateChangelog(version: string, entry: ChangelogEntry): Promise<string>;
  updateVersion(version: string, logger: LogReporter): Promise<void>;
}

export interface IProject extends IWorkspace {
  readonly childWorkspaces: IWorkspace[];

  readonly workspaces: IWorkspace[];
}
