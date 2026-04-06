import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://dyscolor.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['hypher', 'hyphenation.fr'],
    },
  },
});
