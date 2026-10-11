import type { APIRoute } from "astro";
import config from "$config";
import graph from "$graph/content";
import { graphPages } from "$graph/pages";

export function getStaticPaths() {
	return Object.entries(graphPages).map(([path, title]) => ({ params: { section: path.slice(1) }, props: { title, type: path.split("/")[1] } }));
}

export const GET: APIRoute = async ({ props, site }) => {
	const image = await graph({ type: props.type, title: props.title, author: config.author.name, domain: site!.hostname });
	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
