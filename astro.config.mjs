// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kevinkelchen.com',
  devToolbar: {
    enabled: process.env.PLAYWRIGHT_TEST !== '1',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
