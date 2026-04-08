import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "$config";
import graph from "$graph/content";

export async function getStaticPaths() {
	const jottings = await getCollection("jotting", jotting => !jotting.data.draft);

	return jottings.map(jotting => ({
		params: { id: jotting.id },
		props: {
			type: "Jotting",
			title: jotting.data.title,
			time: jotting.data.timestamp.toISOString().split("T")[0].replace(/-/g, "/"),
			tags: jotting.data.tags
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
