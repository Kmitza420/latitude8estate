// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // The home page lives at /home; the bare root forwards to it.
  redirects: {
    '/': '/home',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
