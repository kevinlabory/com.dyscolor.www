import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'static',
  site: 'https://www.dyscolor.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss(), wasm(), topLevelAwait()],
    resolve: {
      alias: {
        '@dyscolor/syllabify-fr': fileURLToPath(new URL('./src/lib/engine.ts', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['hypher', 'hyphenation.fr'],
    },
  },
});
