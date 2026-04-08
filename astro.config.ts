// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import yaml from "@rollup/plugin-yaml";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import swup from "@swup/astro";

import GFM from "remark-gfm";
import ins from "remark-ins";
import mark from "remark-flexible-markers";
import spoiler from "@tuyuritio/remark-spoiler";
import CJK from "remark-cjk-friendly";
import CJKStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import ruby from "@tuyuritio/remark-ruby";
import attr from "@tuyuritio/remark-attribute";
import math from "remark-math";
import gemoji from "remark-gemoji";
import footnote from "remark-footnotes-extra";
import abbr from "@tuyuritio/remark-abbreviation";
import { remarkExtendedTable as table, extendedTableHandlers as tableHandler } from "remark-extended-table";
import alerts from "@tuyuritio/remark-github-alert";
import { rehypeHeadingIds as ids } from "@astrojs/markdown-remark";
import anchor from "rehype-autolink-headings";
import links from "rehype-external-links";
import katex from "rehype-katex";
import figure from "@tuyuritio/rehype-image-figure";
import wrapper from "@tuyuritio/rehype-table-wrapper";
import sectionize from "@hbsnow/rehype-sectionize";
import copy from "@tuyuritio/shiki-code-copy";

import reading from "./src/lib/reading";
import { flexokiDarkTheme, flexokiLightTheme } from "./src/styles/shiki/flexoki";

// https://astro.build/config
export default defineConfig({
	site: "https://tansanrao.com",
	trailingSlash: "never",
	markdown: {
		remarkPlugins: [
			[GFM, { singleTilde: false }],
			ins,
			mark,
			spoiler,
			CJK,
			[CJKStrikethrough, { singleTilde: false }],
			ruby,
			attr,
			math,
			gemoji,
			footnote,
			abbr,
			[table, { colspanWithEmpty: true }],
			[alerts, { typeFormat: "capitalize" }],
			reading
		],
		remarkRehype: {
			footnoteLabel: null,
			footnoteLabelTagName: "p",
			footnoteLabelProperties: {
				className: ["hidden"]
			},
			handlers: {
				...tableHandler
			}
		},
		rehypePlugins: [
			ids,
			[anchor, { behavior: "wrap" }],
			[links, { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] }],
			katex,
			figure,
			wrapper,
			sectionize
		],
		smartypants: false,
		shikiConfig: {
			themes: {
				light: /** @type {import('astro').MarkdownShikiConfig['themes']['light']} */ (flexokiLightTheme),
				dark: /** @type {import('astro').MarkdownShikiConfig['themes']['dark']} */ (flexokiDarkTheme)
			},
			transformers: [copy({ duration: 1500 })]
		}
	},
	vite: {
		// @ts-expect-error
		plugins: [yaml(), tailwindcss()]
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
