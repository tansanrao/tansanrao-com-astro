import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "$config";
import graph from "$graph/content";

export async function getStaticPaths() {
	const entries = await getCollection("notes", entry => !entry.data.draft);

	return entries.map(entry => ({
		params: { id: entry.id },
		props: {
			type: "Notes",
			title: entry.data.title,
			time: entry.data.timestamp.toISOString().split("T")[0].replace(/-/g, "/"),
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
		tags: props.tags
	});

	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
