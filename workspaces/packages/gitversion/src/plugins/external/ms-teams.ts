import { RequestOptions, request } from 'https';

import { PackedPackage } from '../../core/pack-artifact';
import { Project } from '../../core/workspace-utils';
import { IPlugin, IPluginHook } from '../plugin';

import { payload } from './ms-teams-payload';

export class MSTeamsPlugin implements IPlugin {
  name = 'MS Teams release notifications';

  hooks: IPluginHook = {
    onPublish: async (project, packedPackages) => this.onPublish(project, packedPackages),
  };

  async onPublish(project: Project, packedPackage: PackedPackage[]) {
    const body = payload({
      project,
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
