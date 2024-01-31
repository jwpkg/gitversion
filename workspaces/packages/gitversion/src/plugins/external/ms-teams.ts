import { RequestOptions, request } from 'https';

import { VersionBranch } from '../../core/config';
import { PackedPackage } from '../../core/pack-artifact';
import { Project } from '../../core/workspace-utils';
import { IPlugin } from '../plugin';

import { payload } from './ms-teams-payload';

export class MSTeamsPlugin implements IPlugin {
  name = 'MS Teams release notifications';

  async onPublish(project: Project, packedPackages: PackedPackage[]) {
    if (project.config.options.independentVersioning) {
      for (const packedPackage of packedPackages) {
        if (packedPackage.packFile) {
          await this.process(project.config.branch, packedPackage);
        }
      }
    } else {
      const projectPackage = packedPackages.find(p => p.packageRelativeCwd === project.relativeCwd)!;
      if (projectPackage) {
        await this.process(project.config.branch, projectPackage);
      }
    }
  }

  async process(branch: VersionBranch, packedPackage: PackedPackage) {
    const body = payload({
      branch,
      packedPackage,
    });

    if (this.teamsWebhookUrl) {
      await this.notifyTeams(new URL(this.teamsWebhookUrl), body);
    } else {
      console.log('teamsWebhookUrl not set. Printing card content:\n', JSON.stringify(body, null, 2));
    }
  }

  constructor(private teamsWebhookUrl: string) {
  }

  async notifyTeams(url: URL, body: any) {
    return new Promise((resolve, reject) => {
      const content = JSON.stringify(body);
      const options: RequestOptions = {
        host: url.host,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'content-type': 'application/json',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'content-length': content.length,
        },
      };

      console.log(options);

      const req = request(options, res => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', chunk => {
          console.log(`BODY: ${chunk}`);
        });
        resolve(res);
      });

      req.on('error', e => {
        console.log(`problem with request: ${e.message}`);
        reject(e);
      });

      // write data to request body
      console.log(content);
      req.write(content);
      req.end();
    });
  }
}
