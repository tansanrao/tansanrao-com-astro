// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import swup from "@swup/astro";

import { markdownHastPlugins, markdownMdastPlugins } from "./src/lib/markdown/plugins";
import { flexokiDarkTheme, flexokiLightTheme } from "./src/styles/shiki/flexoki";

const buildTimestampUtc = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
	site: "https://tansanrao.com",
	trailingSlash: "never",
	markdown: {
		processor: satteri({
			mdastPlugins: markdownMdastPlugins,
			hastPlugins: markdownHastPlugins,
			features: {
				gfm: true,
				frontmatter: true,
				headingAttributes: true,
				math: false,
				smartPunctuation: false
			}
		}),
		shikiConfig: {
			themes: {
				light: /** @type {import('astro').MarkdownShikiConfig['themes']['light']} */ (flexokiLightTheme),
				dark: /** @type {import('astro').MarkdownShikiConfig['themes']['dark']} */ (flexokiDarkTheme)
			}
		}
	},
	vite: {
		define: {
			// biome-ignore lint/style/useNamingConvention: Build-time globals use constant casing.
			__BUILD_TIMESTAMP_UTC__: JSON.stringify(buildTimestampUtc)
		},
		plugins: [tailwindcss()]
	},
	integrations: [
		svelte(),
		mdx(),
		sitemap(),
		swup({
			globalInstance: true,
			preload: false,
			smoothScrolling: false,
			progress: true
		})
	],
	fonts: [
		{
			name: "Source Serif 4",
			provider: fontProviders.google(),
			weights: [400, 600, 700],
			styles: ["normal", "italic"],
			optimizedFallbacks: false,
			cssVariable: "--font-source-serif-4"
		},
		{
			name: "IBM Plex Mono",
			provider: fontProviders.google(),
			weights: [400, 500, 700],
			optimizedFallbacks: false,
			cssVariable: "--font-ibm-plex-mono"
		}
	]
});
