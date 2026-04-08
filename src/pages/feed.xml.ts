import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getCollection, render } from "astro:content";
import { Feed } from "feed";
import config from "$config";

export const GET: APIRoute = async ({ site }) => {
	const feed = new Feed({
		title: config.title,
		description: config.description,
		author: config.author,
		copyright:
			config.copyright.type === "CC0 1.0"
				? "CC0 1.0 – No Rights Reserved"
				: `${config.copyright.type} © ${config.copyright.year} ${config.author.name}`,
		image: new URL("favicon-96x96.png", site).toString(),
		favicon: new URL("favicon.ico", site).toString(),
		id: site!.toString(),
		link: site!.toString(),
		stylesheet: "feed.xsl"
	});

	let items = [];
	const sections = config.feed?.section || "*";

	if (sections === "*" || sections.includes("note")) {
		const notes = await getCollection("note", note => !note.data.draft);
		notes.forEach(note => {
			Reflect.set(note, "link", new URL(`/note/${note.id}`, site).toString());
		});
		items.push(...notes);
	}

	if (sections === "*" || sections.includes("jotting")) {
		const jottings = await getCollection("jotting", jotting => !jotting.data.draft);
		jottings.forEach(jotting => {
			Reflect.set(jotting, "link", new URL(`/jotting/${jotting.id}`, site).toString());
		});
		items.push(...jottings);
	}

	items = items.sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, config.feed?.limit || items.length);

	const container = await AstroContainer.create();
	await Promise.all(
		items.map(async item => {
			if (item.rendered) {
				const content = await container.renderToString((await render(item)).Content);
				item.rendered.html = content.replace(/(?<=src=")\/(?!\/)([^"]+)/g, `${site?.origin}/$1`);
			}
		})
	);

	items.forEach(item => {
		feed.addItem({
			id: item.id,
			title: item.data.title,
			link: (<any>item).link,
			date: item.data.timestamp,
			content: item.data.sensitive
				? `<p>This content may contain explicit, violent, bloody, or emotionally triggering material.</p><p>To read, please visit the <a href="${(<any>item).link}">original link</a>.</p>`
				: item.rendered?.html,
			description: item.data.description,
			category: item.data.tags?.map((tag: any) => ({ term: tag }))
		});
	});

	return new Response(feed.atom1(), { headers: { "Content-Type": "application/xml" } });
};
