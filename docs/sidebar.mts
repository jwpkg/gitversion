import { DefaultTheme } from 'vitepress';

export const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Gitversion', items: [
      { text: 'Introduction', link: '/' },
      { text: 'Getting started', link: '/tutorials/getting-started' },
      {
        text: 'How to\'s', items: [
          { text: 'Setup demo git', link: '/how-to/setup-demo-git' },
          { text: 'Working with branches', link: '/how-to/working-with-branches' },
        ],
      },
      {
        text: 'Reference', items: [
          { text: 'Configuration', link: '/reference/configuration' },
        ],
      },
      {
        text: 'Explanations', items: [
          { text: '0.x.x releases', link: '/explanation/0.x.x-releases' },
        ],
      },
    ],
  },
];
