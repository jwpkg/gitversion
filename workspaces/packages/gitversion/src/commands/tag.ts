import { Option } from 'clipanion';
import { colorize } from 'colorize-node';

import { BumpManifest } from '../utils/bump-manifest';
import { formatPackageName } from '../utils/format-utils';
import { gitRoot } from '../utils/git';
import { logger } from '../utils/log-reporter';
import { Project } from '../utils/workspace-utils';

import { GitVersionCommand } from './context';

export class TagCommand extends GitVersionCommand {
  static paths = [
    ['tag'],
  ];

  push = Option.Boolean('--push', true);

  async execute(): Promise<number> {
    const project = await Project.load(await gitRoot());
    if (!project) {
      return 1;
    }

    const section = logger.beginSection('Tag versions step');

    const bumpManifest = await BumpManifest.load(project);

    const bumpedWorkspaces = bumpManifest.bumpManifest.bumps;
    if (bumpedWorkspaces.length > 0) {
      const promises = bumpedWorkspaces.map(async bump => {
        logger.reportInfo(`Setting tag for package ${formatPackageName(bump.packageName)}: ${colorize.cyanBright(bump.tag)}`);
        await project.git.addTag(bump.tag, this.push);
      });
      await Promise.all(promises);
    } else {
      logger.reportWarning('Nothing to tag');
    }

    logger.endSection(section);

    return 0;
  }
}
