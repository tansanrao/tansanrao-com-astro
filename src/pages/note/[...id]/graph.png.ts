import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "$config";
import graph from "$graph/content";

export async function getStaticPaths() {
	const notes = await getCollection("note", note => !note.data.draft);

	return notes.map(note => ({
		params: { id: note.id },
		props: {
			type: "Note",
			title: note.data.title,
			time: note.data.timestamp.toISOString().split("T")[0].replace(/-/g, "/"),
			series: note.data.series,
			tags: note.data.tags
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
