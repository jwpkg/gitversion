import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

import { Configuration } from '../config';

import { BumpManifest } from './bump-utils';
import { DEFAULT_PACKAGE_VERSION } from './constants';
import { formatPackageName, formatVersion } from './format-utils';
import { tagPrefix } from './git-utils';
import { Git } from './git';
import { LogReporter } from './log-reporter';

export class Workspace {
  cwd: string;
  relativeCwd: string;
  version: string;
  private: boolean;
  packageName: string;
  manifest: Record<string, any>;
  tagPrefix: string;
  _project?: Project;
  config: Configuration;

  get project(): Project {
    return this._project!;
  }

  constructor(rootCwd: string, relativeCwd: string, manifest: Record<string, any>, config: Configuration) {
    this.cwd = join(rootCwd, relativeCwd);
    this.manifest = manifest;
    this.version = manifest.version ?? DEFAULT_PACKAGE_VERSION;
    this.private = manifest.private ?? false;
    if (!manifest.name) {
      throw new Error(`Invalid manifest. Package at '${relativeCwd}' does not have a name`);
    }
    this.packageName = manifest.name;
    this.relativeCwd = relativeCwd;
    this.config = config;

    this.tagPrefix = config.options.independentVersioning ? tagPrefix(config.options.versionTagPrefix, this.packageName) : tagPrefix(config.options.versionTagPrefix);
  }

  static async loadManifest(cwd: string): Promise<Record<string, any> | undefined> {
    const manifestLocation = join(cwd, 'package.json');
    if (existsSync(manifestLocation)) {
      const manifestContent = await readFile(manifestLocation, {
        encoding: 'utf-8',
      });
      const manifestJson = JSON.parse(manifestContent);
      return manifestJson;
    }
    return undefined;
  }

  async updateVersion(version: string, logger: LogReporter) {
    const newManifest = {
      ...this.manifest,
      version,
    };
    const content = JSON.stringify(newManifest, null, 2);
    logger.reportInfo(`Update package ${formatPackageName(this.packageName)} to version ${formatVersion(version)}`);
    await writeFile(join(this.cwd, 'package.json'), content, {
      encoding: 'utf-8',
    });
    this.manifest = newManifest;
  }
}

export class Project extends Workspace {
  workspaces: Workspace[];
  childWorkspaces: Workspace[];
  git: Git;
  bumpManifest: BumpManifest;

  get project(): Project {
    return this;
  }

  private constructor(cwd: string, manifest: Record<string, any>, childWorkspaces: Workspace[], config: Configuration, bumpManifest: BumpManifest) {
    super(cwd, '.', manifest, config);
    this.childWorkspaces = childWorkspaces;
    this.workspaces = [
      this,
      ...childWorkspaces,
    ];

    this.bumpManifest = bumpManifest;

    this.git = new Git(this.cwd);
  }

  static async load(rootCwd: string): Promise<Project | null> {
    const config = await Configuration.load(rootCwd);
    if (!config) {
      return null;
    }

    const manifest = await Workspace.loadManifest(rootCwd);
    if (manifest?.workspaces && Array.isArray(manifest.workspaces)) {
      const paths = await glob(manifest.workspaces, {
        cwd: rootCwd,
      });

      const workspacePromises = paths.map(async path => {
        const manifest = await Workspace.loadManifest(join(rootCwd, path));
        if (manifest && manifest.private !== true) {
          return new Workspace(rootCwd, path, manifest, config);
        } else {
          return undefined;
        }
      });

      const workspaces = await Promise.all(workspacePromises);
      const allWorkspaces = workspaces.filter((w): w is Workspace => !!w);

      const bumpManifest = await BumpManifest.load(join(rootCwd, 'gitversion.out'));

      const project = new Project(rootCwd, manifest, allWorkspaces, config, bumpManifest);
      allWorkspaces.forEach(w => {
        w._project = project;
      });
      return project;
    }

    throw new Error(`Can't create project at '${rootCwd}' `);
  }
}
