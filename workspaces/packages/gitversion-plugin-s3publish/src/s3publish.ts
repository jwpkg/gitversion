import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { LogReporter } from '@jwpkg/gitversion/src/core/log-reporter';
import { PackedPackage } from '@jwpkg/gitversion/src/core/pack-artifact';
import { IWorkspace } from '@jwpkg/gitversion/src/core/workspace-utils';
import { IPackManager, IPlugin, IPluginInitialize } from '@jwpkg/gitversion';
import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { parse } from 'semver';

export interface S3PublishProps {
  bucketName: string;
  baseFolder?: string;
  fileNameTemplate?: string | string[];
  files?: string[];
  exclude?: string[];
}

export class S3Publish implements IPlugin, IPackManager {
  ident = 's3';
  name = 'S3 publication plugin';
  fileNameTemplate: string | string[];
  private logger?: LogReporter;

  get packManager() {
    return this;
  }

  constructor(private props: S3PublishProps) {
    this.fileNameTemplate = props.fileNameTemplate ?? 'output';
  }

  initialize(configuration: IPluginInitialize) {
    this.logger = configuration.logger;
    return this;
  }

  async pack(workspace: IWorkspace, outputFolder: string): Promise<string | null> {
    if (workspace.relativeCwd === '.') {
      const outputFileName = `${this.name}.zip`;
      const outputFile = createWriteStream(join(outputFolder, outputFileName));
      const archive = archiver('zip');
      archive.pipe(outputFile);
      const folder = this.props.baseFolder ? join(workspace.project.cwd, this.props.baseFolder) : workspace.project.cwd;

      for (const pattern of this.props.files ?? ['**']) {
        archive.glob(pattern, {
          cwd: folder,
          ignore: this.props.exclude,
        });
      }
      await archive.finalize();
      return outputFileName;
    }
    return null;
  }

  async publish(packedPackage: PackedPackage, fileName: string, releaseChannel: string, dryRun: boolean): Promise<void> {
    const templates = Array.isArray(this.fileNameTemplate) ? this.fileNameTemplate : [this.fileNameTemplate];
    for (const template of templates) {
      const keyName = this.generateFilename(template, packedPackage.version, releaseChannel);
      if (dryRun) {
        this.logger?.reportDryrun(`Would be publishing ${keyName} to s3 bucket ${this.props.bucketName}`);
        return;
      } else {
        this.logger?.reportInfo(`Publishing ${keyName} to s3 bucket ${this.props.bucketName}`);
        const s3 = new S3Client({});
        await s3.send(new PutObjectCommand({
          Bucket: this.props.bucketName,
          Key: keyName,
          Body: createReadStream(fileName),
        }));
      }
    }
  }

  generateFilename(template: string, version: string, releaseChannel: string) {
    let result = template;

    result = result.replace('{releaseChannel}', releaseChannel);

    const semver = parse(version);
    if (semver) {
      result = result.replace('{version.major}', `${semver.major}`)
        .replace('{version.minor}', `${semver.minor}`)
        .replace('{version.patch}', `${semver.patch}`)
        .replace('{version}', version);
    }
    return result;
  }
}
