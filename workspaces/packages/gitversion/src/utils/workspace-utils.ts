import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

import { DEFAULT_PACKAGE_VERSION } from './constants';
import { formatPackageName, formatVersion } from './format-utils';
import { logger } from './log-reporter';

export class Workspace {
  cwd: string;
  relativeCwd: string;
  version: string;
  private: boolean;
  packageName: string;
  manifest: Record<string, any>;

  constructor(rootCwd: string, relativeCwd: string, manifest: Record<string, any>) {
    this.cwd = join(rootCwd, relativeCwd);
    this.manifest = manifest;
    this.version = manifest.version ?? DEFAULT_PACKAGE_VERSION;
    this.private = manifest.private ?? false;
    if (!manifest.name) {
      throw new Error(`Invalid manifest. Package at '${relativeCwd}' does not have a name`);
    }
    this.packageName = manifest.name;
    this.relativeCwd = relativeCwd;
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

  async updateVersion(version: string) {
    const newManifest = {
      ...this.manifest,
      version,
    };
    const content = JSON.stringify(newManifest, null, 2);
    logger.reportInfo(`Update package ${formatPackageName(this.packageName)} to version ${formatVersion(version)}`);
    return writeFile(join(this.cwd, 'package.json'), content, {
      encoding: 'utf-8',
    });
  }
}

export class Project extends Workspace {
  workspaces: Workspace[];
  childWorkspaces: Workspace[];

  private constructor(cwd: string, manifest: Record<string, any>, childWorkspaces: Workspace[]) {
    super(cwd, '.', manifest);
    this.childWorkspaces = childWorkspaces;
    this.workspaces = [
      this,
      ...childWorkspaces,
    ];
  }

  static async load(rootCwd: string): Promise<Project> {
    const manifest = await Workspace.loadManifest(rootCwd);
    if (manifest?.workspaces && Array.isArray(manifest.workspaces)) {
      const paths = await glob(manifest.workspaces, {
        cwd: rootCwd,
      });

      const workspacePromises = paths.map(path =>
        Workspace.loadManifest(join(rootCwd, path)).then(manifest => {
          if (manifest) {
            return new Workspace(rootCwd, path, manifest);
          } else {
            return undefined;
          }
        }),
      );
      const workspaces = await Promise.all(workspacePromises);
      return new Project(rootCwd, manifest, workspaces.filter((w): w is Workspace => !!w));
    }
    throw new Error(`Can't create project at '${rootCwd}' `);
  }
}
