// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://tansanrao.com',
  integrations: [tailwind()],
  markdown: {
    remarkPlugins: [
      remarkReadingTime,
      remarkMath
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'github-dark',
      wrap: false
    }
  },
  vite: {
    build: {
      cssMinify: true,
    }
  },
  redirects: {
    "/blog/xnu-kernel-and-darwin-evolution-and-architecture/": "/blog/2025/04/xnu-kernel-and-darwin-evolution-and-architecture/",
    "/blog/my-thoughts-on-internet-search/": "/blog/2025/03/my-thoughts-on-internet-search/",
    "/blog/new-beginnings/": "/blog/2025/01/new-beginnings/",
    "/blog/kubernetes-ha-cluster-with-kubeadm/": "/blog/2020/09/kubernetes-ha-cluster-with-kubeadm/"
  }
});
