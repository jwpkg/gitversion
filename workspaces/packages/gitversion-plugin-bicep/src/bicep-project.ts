import { addToChangelog, BumpType, ChangelogEntry, detectBumpType, determineCurrentVersion, Git, IConfiguration, IGitPlatform, LogReporter, parseConventionalCommits, validateBumpType, VersionBranch } from '@jwpkg/gitversion';
import { PackedPackage } from '@jwpkg/gitversion';
import { IProject, IWorkspace } from '@jwpkg/gitversion';
import { IPackManager, IPlugin, IPluginInitialize } from '@jwpkg/gitversion';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import { parse, prerelease } from 'semver';
import * as t from 'typanion';
import { colorize } from 'colorize-node';

const DEFAULT_PACKAGE_VERSION = '0.0.0';

export interface BicepProjectProps {
  // The name of the manifest file in the workspaces. I.e. metadata.json
  manifestName: string;

  // The name of te default resource group (when working on the main branch)
  defaultReleaseResourceGroup: string;

  // Regex match for a release tag to push to a resource group
  otherReleaseResourceGroups: Record<string, string>;

  // When no group matches the other release use this. Defaults to defaultReleaseResourceGroup
  fallbackReleaseResourceGroup?: string;
}

export const isBicepManifest = t.isObject({
  version: t.isOptional(t.isString()),
  name: t.isString(),
  private: t.isOptional(t.isBoolean()),
  workspaces: t.isOptional(t.isArray(t.isString())),
  modules: t.isOptional(t.isRecord(t.isString())),
});

export type BicepManifest = t.InferType<typeof isBicepManifest>;

export interface BicepManifestContent {
  manifest: BicepManifest;
  eofInEnd: boolean;
}

export async function loadManifest(folder: string, filename: string): Promise<BicepManifestContent | null> {
  const manifestLocation = join(folder, filename);
  if (!existsSync(manifestLocation)) {
    return null;
  }

  const stringContent = await readFile(manifestLocation, 'utf-8');
  const content = JSON.parse(stringContent);
  const errors: string[] = [];
  if (isBicepManifest(content, { errors })) {
    return {
      eofInEnd: stringContent.endsWith('\n'),
      manifest: content,
    };
  }
  return null;
}

async function persistManifest(folder: string, filename: string, manifestContent: BicepManifestContent) {
  let stringContent = JSON.stringify(manifestContent.manifest, null, 2);
  if (manifestContent.eofInEnd) {
    stringContent += '\n';
  }
  await writeFile(join(folder, filename), stringContent, 'utf-8');
}

export class BicepWorkspace implements IWorkspace {
  protected _project: BicepProjectImpl;
  private manifestContent: BicepManifestContent;

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

  get project(): BicepProjectImpl {
    return this._project!;
  }

  get tagPrefix() {
    if (this.config.options.independentVersioning) {
      return `${this.config.options.versionTagPrefix}${this.packageName}@`;
    } else {
      return this.config.options.versionTagPrefix;
    }
  }
  constructor(project: BicepProjectImpl, relativeCwd: string, manifestContent: BicepManifestContent) {
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
    const newManifest: BicepManifest = {
      ...this.manifest,
      version,
    };
    this.manifestContent.manifest = newManifest;

    await persistManifest(this.cwd, this.project.props.manifestName, this.manifestContent);
  }

  async detectBumpType(configuration: IConfiguration, versionBranch: VersionBranch, gitPlatform: IGitPlatform, logger: LogReporter): Promise<BumpType> {
    const tags = await this.project.git.versionTags(this.tagPrefix);
    const currentVersion = determineCurrentVersion(tags, versionBranch, this.tagPrefix);

    const logs = await this.project.git.logs(currentVersion.hash, this.relativeCwd);
    const commits = parseConventionalCommits(logs, gitPlatform);

    logger.reportInfo(`Found ${colorize.cyan(commits.length)} commits following conventional commit standard for version`);
    
    const bumpType = validateBumpType(detectBumpType(commits), logs, configuration, versionBranch, logger);

    return bumpType;
  }
}

export class BicepProject {
  readonly name = 'Bicep project initializer';
  ident = 'bicep';
  constructor(private props: BicepProjectProps) { }

  async initialize(initialize: IPluginInitialize): Promise<BicepProjectImpl | null> {
    const manifestContent = await loadManifest(initialize.cwd, this.props.manifestName);
    if (!manifestContent) {
      return null;
    }
    const project = new BicepProjectImpl(initialize.cwd, manifestContent, initialize, this.props);
    if (project.manifest.workspaces && Array.isArray(project.manifest.workspaces)) {
      const paths = await glob(project.manifest.workspaces, {
        cwd: initialize.cwd,
      });

      const workspacePromises = paths.map(async path => {
        const workspaceManifestContent = await loadManifest(join(initialize.cwd, path), this.props.manifestName);
        if (workspaceManifestContent && workspaceManifestContent.manifest.private !== true) {
          return new BicepWorkspace(project, path, workspaceManifestContent);
        } else {
          return undefined;
        }
      });

      const workspaces = await Promise.all(workspacePromises);
      project.childWorkspaces = workspaces.filter((w): w is BicepWorkspace => !!w);
    }
    return project;
  }
}

class BicepProjectImpl extends BicepWorkspace implements IProject, IPlugin, IPackManager {
  readonly name = 'Bicep project';
  ident = 'bicep';

  private _cwd: string;

  private _git: Git;

  get git(): Git {
    return this._git;
  }

  get cwd(): any {
    return this._cwd;
  }

  get config(): any {
    return this.application;
  }

  childWorkspaces: BicepWorkspace[] = [];

  get workspaces(): BicepWorkspace[] {
    return [
      this,
      ...this.childWorkspaces,
    ];
  }

  get project(): BicepProjectImpl {
    return this;
  }

  get packManager() {
    return this;
  }

  constructor(cwd: string, manifestContent: BicepManifestContent, private application: IPluginInitialize, public props: BicepProjectProps) {
    super((undefined as any as BicepProjectImpl), '.', manifestContent);
    this._project = this;
    this._cwd = cwd;
    this._git = this.application.git;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string | string[] | Record<string, string> | null> {
    if (!(workspace instanceof BicepWorkspace)) {
      return null;
    }

    if (workspace.private) {
      return null;
    }

    await mkdir(outputFolder, {
      recursive: true,
    });


    if (workspace.manifest.modules) {
      const builds: Promise<void>[] = [];
      const results: Record<string, string> = {};

      for (const [moduleName, moduleFile] of Object.entries(workspace.manifest.modules)) {
        const moduleFilePath = join(workspace.cwd, moduleFile);
        if (!existsSync(moduleFilePath)) {
          throw new Error(`Module file '${moduleFile}' for module '${moduleName}' does not exist in workspace '${workspace.relativeCwd}'`);
        }
        const normalizedOutputName = `${moduleName}.json`;
        builds.push(new Promise((resolve, reject) => {
          this.bicepPack(workspace, outputFolder, normalizedOutputName, moduleFilePath)
            .then(result => {
              results[moduleName] = result;
              resolve();
            })
            .catch(error => {
              reject(new Error(`Error packing module '${moduleName}' in workspace '${workspace.relativeCwd}': ${error}`));
            });
        }));
      }
      await Promise.all(builds);

      return results;
    } else {
      const normalizedOutputName = `${workspace.packageName.replace(/[ _/\\]/g, '-')}.json`;
      return this.bicepPack(workspace, outputFolder, normalizedOutputName, join(workspace.cwd, 'main.bicep'));
    }
  }

  async bicepPack(workspace: BicepWorkspace, outputFolder: string, normalizedOutputName: string, fileName: string): Promise<string> {
    await this.application.executor.exec(['az', 'bicep', 'build', '--file', fileName, '--outfile', join(outputFolder, normalizedOutputName)], {
      cwd: workspace.cwd,
    });

    return normalizedOutputName;
  }


  async publish(packedPackage: PackedPackage, fileName: string, releaseTag: string, dryRun: boolean, module?: string): Promise<void> {
    const fromVersion = parse(packedPackage.previousVersion);
    const toVersion = parse(packedPackage.version);

    const versions: string[] = [];
    // construct additional versions like
    // latest
    // 1.x
    // 1.1.x
    // prerelease
    //
    if (prerelease(packedPackage.version)) {
      versions.push(releaseTag);
    } else {
      versions.push('latest');
      if (fromVersion?.major === toVersion?.major) {
        versions.push(`${fromVersion?.major}.x`);

        if (fromVersion?.minor === toVersion?.major) {
          versions.push(`${fromVersion?.major}.${fromVersion?.minor}.x`);
        }
      }
    }
    versions.push(packedPackage.version);

    const resourceGroup = this.findResourceGroup(releaseTag);

    const commands = versions.map(version => ['az', 'ts', 'create', '--name', module ?? packedPackage.packageName, '--version', version, '--resource-group', resourceGroup, '-f', fileName, '-y']);
    if (dryRun) {
      this.application.logger.reportDryrun(`Would be running:\n ${commands.join('\n')}`);
      return;
    } else {
      const promises = commands.map(command => this.application.executor.exec(command, {
        cwd: this.application.packFolder,
      }));
      await Promise.all(promises);
    }
  }

  findResourceGroup(releaseTag: string): string {
    if (releaseTag === 'latest') {
      return this.props.defaultReleaseResourceGroup;
    }

    for (const [key, value] of Object.entries(this.props.otherReleaseResourceGroups ?? {})) {
      const regex = new RegExp(key);
      if (regex.test(releaseTag)) {
        return value;
      }
    }
    return this.props.fallbackReleaseResourceGroup ?? this.props.defaultReleaseResourceGroup;
  }
}
