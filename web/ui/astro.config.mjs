// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The canonical origin the site is published at. It feeds canonical URLs,
// Open Graph tags, structured data and the sitemap, so it must be the real
// public address in production. Override at build time with PUBLIC_SITE_URL.
const site = process.env.PUBLIC_SITE_URL ?? 'https://latitude8estate.com';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    react(),
    sitemap({
      // The bare root only forwards to /home, and the 404 page is not a page.
      filter: (page) => !page.endsWith('/404/') && page !== `${site}/`,
    }),
  ],
  // The home page lives at /home; the bare root forwards to it.
  redirects: {
    '/': '/home',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
