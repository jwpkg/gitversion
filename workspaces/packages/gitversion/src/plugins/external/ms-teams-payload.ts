import { ChangelogEntry } from '../../core/changelog';
import { VersionBranch } from '../../core/configuration';
import { PackedPackage } from '../../core/pack-artifact';

export interface PayloadUrl {
  readonly name: string;
  readonly url: string;
}

export interface PayloadProps {
  branch: VersionBranch;
  packedPackage: PackedPackage;
}

function formatChangeLog(changeLogEntry?: ChangelogEntry) {
  if (!changeLogEntry) {
    return [{
      type: 'TextBlock',
      separator: true,
      text: '<< no changelog>>',
      wrap: true,
    }];
  }
  const changeLog = `${changeLogEntry.headerLine}\n${changeLogEntry.body}`;
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
                  text: `New release: ${props.packedPackage.packageName} @ ${props.packedPackage.version}`,
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
                  value: props.packedPackage.packageName,
                },
                {
                  title: 'Version',
                  value: props.packedPackage.version,
                },

                {
                  title: 'Branch',
                  value: `${props.branch.name} - (${props.branch.type} branch)`,
                },
              ],
            },
            {
              type: 'TextBlock',
              text: 'Changelog',
              wrap: true,
              weight: 'Lighter',
            },
            ...formatChangeLog(props.packedPackage.changeLog),
          ],
        },
      },
    ],
  };
};
