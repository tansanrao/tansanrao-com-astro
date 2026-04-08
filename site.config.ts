import siteConfig from "./src/lib/config";

const config = siteConfig({
	title: "Tanuj Ravi Rao",
	prologue: "If you need a website\nthat loads fast and has great SEO, then Astro is for you.",
	author: {
		name: "Tanuj Ravi Rao",
		email: "email@tansanrao.com",
		link: "https://tansanrao.com"
	},
	description: "A personal blog by Tanuj Ravi Rao.",
	copyright: {
		type: "CC BY-NC-SA 4.0",
		year: "2026"
	},
	timezone: "UTC",
	pagination: {
		note: 15,
		jotting: 24
	},
	heatmap: {
		unit: "week"
	},
	feed: {
		section: "*",
		limit: 20
	},
	latest: "*"
});

export default config;
