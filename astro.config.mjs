// @ts-check
import { defineConfig } from 'astro/config';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://tansanrao.com',

  vite: {
      plugins: [tailwindcss()],
      resolve: {
          alias: {
              '@components': join(srcDir, 'components'),
              '@assets': join(srcDir, 'assets'),
              '@layouts': join(srcDir, 'layouts'),
              '@styles': join(srcDir, 'styles'),
              '@utils': join(srcDir, 'utils'),
              '@config': join(srcDir, 'config'),
              '@types': join(srcDir, 'types')
          }
      }
  },

  integrations: [icon()]
});