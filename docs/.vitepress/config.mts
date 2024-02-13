import { defineConfig } from 'vitepress'



// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Testing gitversion docs",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Getting started', link: '/tutorials/getting-started' },
          { text: 'Runtime API Examples', link: '/api-examples' },
          {
            text: 'How to\'s', items: [
              { text: 'Working with branched', link: '/how-to/working-with-branches' },
              { text: 'Setup demo git', link: '/how-to/setup-demo-git' },
            ],
          },
          {
            text: 'Explanations', items: [
              { text: '0.x.x releases', link: '/projects/gitversion/explanation/0.x.x-releases' },
            ],
          },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
