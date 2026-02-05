// @ts-check
import { defineConfig } from 'astro/config';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { transformerCopyButton } from '@rehype-pretty/transformers';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import icon from 'astro-icon';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
// https://astro.build/config
export default defineConfig({
  site: 'https://tansanrao.com',

  markdown: {
      shikiConfig: {
          themes: {
              light: 'github-light',
              dark: 'github-dark'
          },
          transformers: [
              transformerCopyButton({
                  visibility: 'always',
                  feedbackDuration: 2500,
                  jsx: true
              })
          ]
      },
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
  },

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

  integrations: [icon(), mdx()]
});