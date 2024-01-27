import { PackedPackage } from '../../core/pack-artifact';
import { Project } from '../../core/workspace-utils';

export interface PayloadUrl {
  readonly name: string;
  readonly url: string;
}

export interface PayloadProps {
  project: Project;
  packedPackage: PackedPackage[];
}

function formatChangeLog(changeLog?: string) {
  if (!changeLog) {
    return [{
      type: 'TextBlock',
      separator: true,
      text: '<< no changelog>>',
      wrap: true,
    }];
  }
  const changelogText = changeLog
    .replace(/^## .*\n/gm, '')
    .replace(/^### (.*)\n/gm, '**$1**')
    .replace(/^\n+/, '');
  return [{
    type: 'TextBlock',
    separator: true,
    text: changelogText,
    wrap: true,
  }];
}

export const payload = (props: PayloadProps) => {
  const projectPackage = props.packedPackage.find(p => p.packageRelativeCwd === props.project.relativeCwd)!;
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          msteams: {
            width: 'Full',
          },
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.5',
          body: [
            {
              type: 'Container',
              items: [
                {
                  type: 'TextBlock',
                  text: `New release: ${props.project.packageName} @ ${projectPackage.version}`,
                  wrap: true,
                  size: 'ExtraLarge',
                  weight: 'Bolder',
                },
              ],
              style: 'emphasis',
              bleed: true,
            },
            {
              type: 'TextBlock',
              text: 'Release details',
              wrap: true,
              weight: 'Lighter',
            },
            {
              type: 'FactSet',
              separator: true,
              facts: [
                {
                  title: 'Name',
                  value: props.project.packageName,
                },
                {
                  title: 'Version',
                  value: projectPackage.version,
                },

                {
                  title: 'Branch',
                  value: `${props.project.config.branch.name} - (${props.project.config.branch.type} branch)`,
                },
              ],
            },
            {
              type: 'TextBlock',
              text: 'Changelog',
              wrap: true,
              weight: 'Lighter',
            },
            ...formatChangeLog(projectPackage.changeLog),
          ],
        },
      },
    ],
  };
};
