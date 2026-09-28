// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
// Phase 0: output: 'static' (Pages SSG 預設)
// Phase 1+ 將改為 output: 'server' + @astrojs/cloudflare adapter (SSR for 會員/結帳)
export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  server: {
    port: 4321,
    host: true,
  },
});