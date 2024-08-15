import { Application } from '../core/application';
import { formatVersionBranch } from '../core/format-utils';

import { GitBumpCommand } from './context';

export class CheckCommand extends GitBumpCommand {
  static paths = [
    ['check'],
  ];

  async execute(): Promise<number> {
    const { project, git, logger, branch, gitPlatform, pluginManager, configuration } = await Application.init(this.context.application);
    if (!project) {
      return 1;
    }

    logger.reportInfo(`Git platform plugin    : ${(gitPlatform as any).name}`);
    logger.reportInfo(`Remote                 : ${await git.remoteUrl()}`);
    logger.reportInfo(`Branch                 : ${await gitPlatform.currentBranch()}`);
    logger.reportInfo(`Gitversion branch type : ${formatVersionBranch(branch)}`);
    logger.reportInfo(`Staging folder         : ${configuration.stagingFolder}`);
    logger.reportInfo('Active plugins:');
    for (const plugin of pluginManager.availablePlugins) {
      logger.reportInfo(`- ${plugin.name}`);
    }


    return 0;
  }
}
