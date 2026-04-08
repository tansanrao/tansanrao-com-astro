import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { blogEntryRestParam } from "$lib/paths";
import config from "$config";
import graph from "$graph/content";

export async function getStaticPaths() {
	const entries = await getCollection("blog", entry => !entry.data.draft);

	return entries.map(entry => ({
		params: { id: blogEntryRestParam(entry) },
		props: {
			type: "Blog",
			title: entry.data.title,
			time: entry.data.timestamp.toISOString().split("T")[0].replace(/-/g, "/"),
			series: entry.data.series,
			tags: entry.data.tags
		}
	}));
}

export const GET: APIRoute = async ({ props }) => {
	const image = await graph({
		type: props.type,
		site: config.title,
		author: config.author.name,
		title: props.title,
		time: props.time,
		series: props.series,
		tags: props.tags
	});

	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
