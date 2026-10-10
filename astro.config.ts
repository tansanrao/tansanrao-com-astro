// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { markdownHastPlugins, markdownMdastPlugins } from "./src/lib/markdown/plugins";
import { flexokiDarkTheme, flexokiLightTheme } from "./src/styles/shiki/flexoki";

const buildTimestampUtc = new Date().toISOString();

// Use the checked-in migration snapshot, never the current content dates.
// Astro normalizes trailing slashes; Cloudflare's explicit slash aliases stay in _redirects.
const legacyRedirects = Object.fromEntries(
	readFileSync(new URL("./public/_redirects", import.meta.url), "utf8")
		.split("\n")
		.filter(line => line.startsWith("/"))
		.map(line => line.trim().split(/\s+/))
		.filter(([source]) => !source.endsWith("/"))
		.map(([source, destination]) => [source, { destination, status: 301 as const }])
);

// https://astro.build/config
export default defineConfig({
	site: "https://tansanrao.com",
	trailingSlash: "never",
	redirects: legacyRedirects,
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
			defaultColor: false,
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
	integrations: [sitemap({ filter: url => !/^\/(?:blog|cv)(?:\/|$)/.test(new URL(url).pathname) })],
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
