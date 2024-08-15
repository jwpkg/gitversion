import { defineConfig } from 'vitepress';

const sidebar = await import('../sidebar.mjs');

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Testing gitbump docs",
  description: "A VitePress Site",
  themeConfig: {
    nav: [
      { text: 'Gitbump', link: '/tutorials/getting-started' },
    ],

    sidebar: sidebar.sidebar
  }
})
