import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import * as t from 'typanion';

import { ChangelogEntry, addToChangelog } from '../../../core/changelog';
import { IConfiguration } from '../../../core/configuration';
import { DEFAULT_PACKAGE_VERSION } from '../../../core/constants';
import { formatPackageName, formatVersion } from '../../../core/format-utils';
import { LogReporter } from '../../../core/log-reporter';
import { IProject, IWorkspace } from '../../../core/workspace-utils';
import { IPlugin, IPluginInitialize } from '../..';

export const isNodeManifest = t.isPartial({
  version: t.isOptional(t.isString()),
  name: t.isString(),
  private: t.isOptional(t.isBoolean()),
  workspaces: t.isOptional(t.isArray(t.isString())),
});

export type NodeManifest = t.InferType<typeof isNodeManifest>;

const NODE_MANIFEST_NAME = 'package.json';

export async function loadManifest(folder: string): Promise<NodeManifest | null> {
  const content = JSON.parse(await readFile(join(folder, NODE_MANIFEST_NAME), 'utf-8'));
  const errors: string[] = [];
  if (isNodeManifest(content, { errors })) {
    return content;
  }
  return null;
}

export async function persistManifest(folder: string, manifest: NodeManifest) {
  await writeFile(join(folder, NODE_MANIFEST_NAME), JSON.stringify(manifest, null, 2), 'utf-8');
}

export class NodeWorkspace implements IWorkspace {
  protected _project: NodeProject;
  private logger: LogReporter;

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

  get project(): NodeProject {
    return this._project!;
  }

  get tagPrefix() {
    if (this.config.options.independentVersioning) {
      return `${this.config.options.versionTagPrefix}${this.packageName}@`;
    } else {
      return this.config.options.versionTagPrefix;
    }
  }

  constructor(project: NodeProject, logger: LogReporter, relativeCwd: string, manifest: NodeManifest) {
    this.manifest = manifest;
    this.logger = logger;

    if (!manifest.name) {
      throw new Error(`Invalid manifest. Package at '${relativeCwd}' does not have a name`);
    }
    this.relativeCwd = relativeCwd;
    this._project = project;
  }

  async updateChangelog(entry: ChangelogEntry) {
    const changeLogFile = join(this.cwd, 'CHANGELOG.md');
    let changeLog = '';
    if (existsSync(changeLogFile)) {
      changeLog = await readFile(changeLogFile, 'utf-8');
    }
    changeLog = addToChangelog(entry, changeLog);
    await writeFile(changeLogFile, changeLog, 'utf-8');
    return changeLogFile;
  }

  async updateVersion(version: string) {
    const newManifest: NodeManifest = {
      ...this.manifest,
      version,
    };
    this.logger.reportInfo(`Update package ${formatPackageName(this.packageName)} to version ${formatVersion(version)}`);
    await persistManifest(this.cwd, newManifest);
    this.manifest = newManifest;
  }
}

export class NodeProject extends NodeWorkspace implements IProject, IPlugin {
  readonly name = 'Node project';

  private _cwd: string;
  private _config: IConfiguration;

  get cwd(): any {
    return this._cwd;
  }

  get config(): any {
    return this._config;
  }

  childWorkspaces: NodeWorkspace[] = [];

  get workspaces(): NodeWorkspace[] {
    return [
      this,
      ...this.childWorkspaces,
    ];
  }

  get project(): NodeProject {
    return this;
  }

  static async initialize(initialize: IPluginInitialize): Promise<NodeProject | null> {
    const manifest = await loadManifest(initialize.cwd);
    if (!manifest) {
      return null;
    }

    const project = new NodeProject(initialize.cwd, initialize.logger, manifest, initialize);

    if (manifest?.workspaces && Array.isArray(manifest.workspaces)) {
      const paths = await glob(manifest.workspaces, {
        cwd: initialize.cwd,
      });

      const workspacePromises = paths.map(async path => {
        const manifest = await loadManifest(join(initialize.cwd, path));
        if (manifest && manifest.private !== true) {
          return new NodeWorkspace(project, initialize.logger, path, manifest);
        } else {
          return undefined;
        }
      });

      const workspaces = await Promise.all(workspacePromises);
      project.childWorkspaces = workspaces.filter((w): w is NodeWorkspace => !!w);
    }
    return project;
  }

  private constructor(cwd: string, logger: LogReporter, manifest: NodeManifest, config: IConfiguration) {
    super((undefined as any as NodeProject), logger, '.', manifest);
    this._project = this;
    this._cwd = cwd;
    this._config = config;
  }
}
