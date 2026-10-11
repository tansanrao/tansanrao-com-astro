import type { APIRoute } from "astro";
import config from "$config";
import graph from "$graph/content";

/**
 * Homepage image, also used as the fallback for pages without their own card.
 */
export const GET: APIRoute = async ({ site }) => {
	const image = await graph({
		type: "home",
		title: "Hi, I’m Tanuj.",
		author: config.author.name,
		domain: site!.hostname
	});

	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
