import siteConfig from "./src/lib/config";

const config = siteConfig({
	title: "Tanuj Ravi Rao",
	prologue:
		"This is the website of Tanuj Ravi Rao. I'm an engineer turned researcher working on accelerating dataplanes through kernel extensions. This is a collection of my thoughts, notes, and writings on various topics that interest me. I hope you find something interesting here.",
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
		blog: 15,
		notes: 24
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
