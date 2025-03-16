// @ts-check
import { defineConfig } from 'astro/config';

import auth from 'auth-astro';

import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [auth(), react()],
  adapter: node({
    mode: 'standalone'
  }),
  output: "server"
});
