import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://dyscolor.com',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['hypher', 'hyphenation.fr'],
    },
  },
});
