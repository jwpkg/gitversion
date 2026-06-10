import { colorize } from 'colorize-node';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import * as t from 'typanion';

import { BumpType, detectBumpType, validateBumpType } from '../../../core/bump-utils';
import { ChangelogEntry, addToChangelog } from '../../../core/changelog';
import { IConfiguration, VersionBranch } from '../../../core/configuration';
import { DEFAULT_PACKAGE_VERSION } from '../../../core/constants';
import { parseConventionalCommits } from '../../../core/conventional-commmit-utils';
import { Git } from '../../../core/git';
import { LogReporter } from '../../../core/log-reporter';
import { determineCurrentVersion } from '../../../core/version-utils';
import { IProject, IWorkspace } from '../../../core/workspace-utils';
import { IGitPlatform, IPlugin, IPluginInitialize } from '../..';

export const isNodeManifest = t.isPartial({
  version: t.isOptional(t.isString()),
  name: t.isString(),
  private: t.isOptional(t.isBoolean()),
  workspaces: t.isOptional(t.isArray(t.isString())),
  dependencies: t.isOptional(t.isRecord(t.isString())),
  devDependencies: t.isOptional(t.isRecord(t.isString())),
  peerDependencies: t.isOptional(t.isRecord(t.isString())),
});

export type NodeManifest = t.InferType<typeof isNodeManifest>;

export interface NodeManifestContent {
  manifest: NodeManifest;
  eofInEnd: boolean;
}

const NODE_MANIFEST_NAME = 'package.json';

export async function loadManifest(folder: string): Promise<NodeManifestContent | null> {
  const manifestLocation = join(folder, NODE_MANIFEST_NAME);
  if (!existsSync(manifestLocation)) {
    return null;
  }

  const stringContent = await readFile(manifestLocation, 'utf-8');
  const content = JSON.parse(stringContent);
  const errors: string[] = [];
  if (isNodeManifest(content, { errors })) {
    return {
      eofInEnd: stringContent.endsWith('\n'),
      manifest: content,
    };
  }
  return null;
}

export async function persistManifest(folder: string, manifestContent: NodeManifestContent) {
  let stringContent = JSON.stringify(manifestContent.manifest, null, 2);
  if (manifestContent.eofInEnd) {
    stringContent += '\n';
  }
  await writeFile(join(folder, NODE_MANIFEST_NAME), stringContent, 'utf-8');
}

export class NodeWorkspace implements IWorkspace {
  protected _project: NodeProject;
  private manifestContent: NodeManifestContent;

  get manifest() {
    return this.manifestContent.manifest;
  }

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

  get workspaceDependencies(): string[] {
    const allWorkspaceNames = new Set(this.project.workspaces.map(w => w.packageName));
    const allDeps = {
      ...this.manifest.dependencies,
      ...this.manifest.devDependencies,
      ...this.manifest.peerDependencies,
    };
    return Object.keys(allDeps).filter(dep => allWorkspaceNames.has(dep));
  }

  constructor(project: NodeProject, relativeCwd: string, manifestContent: NodeManifestContent) {
    this.manifestContent = manifestContent;

    if (!this.manifest.name) {
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
    this.manifestContent.manifest = newManifest;

    await persistManifest(this.cwd, this.manifestContent);
  }

  async detectBumpType(configuration: IConfiguration, versionBranch: VersionBranch, gitPlatform: IGitPlatform, logger?: LogReporter): Promise<BumpType> {
    const tags = await this.project.git.versionTags(this.tagPrefix);
    const currentVersion = determineCurrentVersion(tags, versionBranch, this.tagPrefix);

    const logs = await this.project.git.logs(currentVersion.hash, this.relativeCwd);
    const commits = parseConventionalCommits(logs, gitPlatform);

    logger?.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);

    const bumpType = validateBumpType(detectBumpType(commits), logs, configuration, versionBranch, logger);

    return bumpType;
  }
}

export class NodeProject extends NodeWorkspace implements IProject, IPlugin {
  readonly name = 'Node project';

  private _cwd: string;
  private _config: IConfiguration;
  private _git: Git;

  get cwd(): any {
    return this._cwd;
  }

  get config(): any {
    return this._config;
  }

  get git(): Git {
    return this._git;
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
    const manifestContent = await loadManifest(initialize.cwd);
    if (!manifestContent) {
      return null;
    }

    const project = new NodeProject(initialize.cwd, manifestContent, initialize, initialize.git);

    if (project.manifest.workspaces && Array.isArray(project.manifest.workspaces)) {
      const paths = await glob(project.manifest.workspaces, {
        cwd: initialize.cwd,
      });

      const workspacePromises = paths.map(async path => {
        const worspaceManifestContent = await loadManifest(join(initialize.cwd, path));
        if (worspaceManifestContent && worspaceManifestContent.manifest.private !== true) {
          return new NodeWorkspace(project, path, worspaceManifestContent);
        } else {
          return undefined;
        }
      });

      const workspaces = await Promise.all(workspacePromises);
      project.childWorkspaces = workspaces.filter((w): w is NodeWorkspace => !!w);
    }
    return project;
  }

  private constructor(cwd: string, manifestContent: NodeManifestContent, config: IConfiguration, git: Git) {
    super((undefined as any as NodeProject), '.', manifestContent);
    this._project = this;
    this._cwd = cwd;
    this._config = config;
    this._git = git;
  }
}
