import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

import { IGitPlatformPlugin } from '../plugins/plugin';

import { ChangelogEntry, addToChangelog } from './changelog';
import { Configuration } from './configuration';
import { DEFAULT_PACKAGE_VERSION } from './constants';
import { formatPackageName, formatVersion } from './format-utils';
import { Git } from './git';
import { LogReporter } from './log-reporter';
import { NodeManifest, loadManifest, persistManifest } from './node-manifest';

export interface IWorkspace {
  readonly manifest: NodeManifest;

  readonly relativeCwd: string;

  readonly cwd: string;

  readonly version: string;

  readonly private: boolean;

  readonly config: Configuration;

  readonly packageName: string;

  readonly project: IProject;

  readonly tagPrefix: string;

  updateChangelog(version: string, entry: ChangelogEntry): Promise<string>;
  updateVersion(version: string, logger: LogReporter): Promise<void>;
}

export interface IProject extends IWorkspace {
  readonly gitPlatform: IGitPlatformPlugin;

  readonly childWorkspaces: IWorkspace[];
  readonly git: Git;

  readonly workspaces: IWorkspace[];

  readonly stagingFolder: string;
}

export class Workspace implements IWorkspace {
  protected _project: Project;

  manifest: NodeManifest;

  readonly relativeCwd: string;

  get cwd() {
    return join(this.project.cwd, this.relativeCwd);
  }

  get version() {
    return this.manifest.version ?? DEFAULT_PACKAGE_VERSION;
  }

  get private() {
    return this.manifest.private ?? false;
  }

  get config() {
    return this.project.config;
  }

  get packageName() {
    return this.manifest.name;
  }

  get project(): Project {
    return this._project!;
  }

  get tagPrefix() {
    if (this.config.options.independentVersioning) {
      return `${this.config.options.versionTagPrefix}${this.packageName}@`;
    } else {
      return this.config.options.versionTagPrefix;
    }
  }

  constructor(project: Project, relativeCwd: string, manifest: NodeManifest) {
    this.manifest = manifest;
    if (!manifest.name) {
      throw new Error(`Invalid manifest. Package at '${relativeCwd}' does not have a name`);
    }
    this.relativeCwd = relativeCwd;
    this._project = project;
  }

  async updateChangelog(version: string, entry: ChangelogEntry) {
    const changeLogFile = join(this.cwd, 'CHANGELOG.md');
    let changeLog = '';
    if (existsSync(changeLogFile)) {
      changeLog = await readFile(changeLogFile, 'utf-8');
    }
    changeLog = addToChangelog(entry, version, changeLog);
    await writeFile(changeLogFile, changeLog, 'utf-8');
    return changeLogFile;
  }

  async updateVersion(version: string, logger: LogReporter) {
    const newManifest: NodeManifest = {
      ...this.manifest,
      version,
    };
    logger.reportInfo(`Update package ${formatPackageName(this.packageName)} to version ${formatVersion(version)}`);
    await persistManifest(this.cwd, newManifest);
    this.manifest = newManifest;
  }
}

export class Project extends Workspace implements IProject {
  private _cwd: string;
  private _config: Configuration;

  get gitPlatform(): IGitPlatformPlugin {
    return this.config.pluginManager.gitPlatform!;
  }

  childWorkspaces: Workspace[] = [];
  git: Git;

  get workspaces(): Workspace[] {
    return [
      this,
      ...this.childWorkspaces,
    ];
  }

  get cwd() {
    return this._cwd;
  }

  get config() {
    return this._config;
  }

  get project(): Project {
    return this;
  }

  get stagingFolder() {
    return join(this.cwd, 'gitversion.out');
  }

  private constructor(cwd: string, manifest: NodeManifest, config: Configuration) {
    super((undefined as any as Project), '.', manifest);
    this._project = this;
    this._cwd = cwd;
    this._config = config;

    this.git = new Git(this.cwd);
  }

  static async load(configuration: Configuration): Promise<Project | null> {
    const manifest = await loadManifest(configuration.cwd);

    const project = new Project(configuration.cwd, manifest, configuration);

    if (manifest?.workspaces && Array.isArray(manifest.workspaces)) {
      const paths = await glob(manifest.workspaces, {
        cwd: configuration.cwd,
      });

      const workspacePromises = paths.map(async path => {
        const manifest = await loadManifest(join(configuration.cwd, path));
        if (manifest && manifest.private !== true) {
          return new Workspace(project, path, manifest);
        } else {
          return undefined;
        }
      });

      const workspaces = await Promise.all(workspacePromises);
      project.childWorkspaces = workspaces.filter((w): w is Workspace => !!w);
    }
    return project;
  }
}
