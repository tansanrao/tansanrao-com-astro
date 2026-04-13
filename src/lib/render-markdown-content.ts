import { getImage } from "astro:assets";
import imageAssetMap from "astro:asset-imports";
import type { CollectionEntry } from "astro:content";
import type { MarkdownHeading } from "@astrojs/markdown-remark";

type MarkdownEntry = CollectionEntry<"blog"> | CollectionEntry<"notes">;

type MarkdownRenderResult = {
	html: string;
	headings: MarkdownHeading[];
	remarkPluginFrontmatter: Record<string, any>;
};

type ContentImageProps = {
	src: string;
	[key: string]: unknown;
};

const CONTENT_LAYER_IMAGE_REGEX = /__ASTRO_IMAGE_="([^"]+)"/g;
const CONTENT_IMAGE_FLAG = "astroContentImageFlag";

function escapeAttribute(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function imageSrcToImportId(imageSrc: string, filePath?: string) {
	if (!filePath || imageSrc.startsWith("/") || URL.canParse(imageSrc)) return;

	const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
	params.set("importer", filePath);
	return `${imageSrc}?${params.toString()}`;
}

function serializeAttributes(attributes: Record<string, unknown>) {
	return Object.entries(attributes)
		.flatMap(([key, value]) => {
			if (value === undefined || value === null || value === false) return [];
			if (value === true) return [key];
			return [`${key}="${escapeAttribute(String(value))}"`];
		})
		.join(" ");
}

async function resolveImageAttributes(imagePath: string, filePath?: string) {
	const decoded = JSON.parse(imagePath.replaceAll("&#x22;", '"')) as ContentImageProps;

	if (URL.canParse(decoded.src)) {
		const image = await getImage(decoded);
		const { index: _index, ...attributes } = image.attributes;
		return serializeAttributes({
			...attributes,
			src: image.src,
			srcset: image.srcSet.attribute || undefined
		});
	}

	const importId = imageSrcToImportId(decoded.src, filePath);
	const imported = importId ? imageAssetMap.get(importId) : undefined;
	if (!imported) return undefined;

	const image = await getImage({ ...decoded, src: imported });
	const { index: _index, ...attributes } = image.attributes;

	return serializeAttributes({
		...attributes,
		src: image.src,
		srcset: image.srcSet.attribute || undefined,
		"data-zoom-src": imported.src
	});
}

function addZoomSourcesToResolvedImages(html: string, localImagePaths: string[], filePath?: string) {
	let localImageIndex = 0;

	return html.replaceAll(/<img\b[^>]*>/g, imageTag => {
		if (imageTag.includes("data-zoom-src=") || !imageTag.includes("/_astro/")) {
			return imageTag;
		}

		const imagePath = localImagePaths[localImageIndex++];
		const importId = imagePath ? imageSrcToImportId(imagePath, filePath) : undefined;
		const imported = importId ? imageAssetMap.get(importId) : undefined;
		if (!imported) return imageTag;

		return imageTag.replace(/>$/, ` data-zoom-src="${escapeAttribute(imported.src)}">`);
	});
}

export async function renderMarkdownContent(entry: MarkdownEntry): Promise<MarkdownRenderResult> {
	const html = entry.rendered?.html;
	if (!html) {
		throw new Error(`Rendered HTML is unavailable for content entry "${entry.id}".`);
	}

	const resolvedImages = new Map<string, string>();
	for (const [, imagePath] of html.matchAll(CONTENT_LAYER_IMAGE_REGEX)) {
		if (resolvedImages.has(imagePath)) continue;

		const attributes = await resolveImageAttributes(imagePath, entry.filePath);
		if (attributes) {
			resolvedImages.set(imagePath, attributes);
		}
	}

	const localImagePaths = Array.isArray(entry.rendered?.metadata?.localImagePaths)
		? entry.rendered.metadata.localImagePaths.filter((value): value is string => typeof value === "string")
		: [];

	const resolvedHtml = addZoomSourcesToResolvedImages(
		html.replaceAll(CONTENT_LAYER_IMAGE_REGEX, (full, imagePath) => resolvedImages.get(imagePath) ?? full),
		localImagePaths,
		entry.filePath
	);

	return {
		html: resolvedHtml,
		headings: entry.rendered?.metadata?.headings ?? [],
		remarkPluginFrontmatter: entry.rendered?.metadata?.frontmatter ?? {}
	};
}
