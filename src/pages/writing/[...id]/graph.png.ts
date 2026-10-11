import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { writingEntryRestParam } from "$lib/paths";
import Time from "$lib/time";
import config from "$config";
import graph from "$graph/content";

export async function getStaticPaths() {
	const entries = await getCollection("writing", entry => !entry.data.draft);

	return entries.map(entry => ({
		params: { id: writingEntryRestParam(entry) },
		props: {
			type: "writing",
			title: entry.data.title,
			time: Time.toLocaleDateString(entry.data.publishedAt, "en-US")
		}
	}));
}

export const GET: APIRoute = async ({ props, site }) => {
	const image = await graph({
		type: props.type,
		domain: site!.hostname,
		author: config.author.name,
		title: props.title,
		time: props.time
	});

	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
