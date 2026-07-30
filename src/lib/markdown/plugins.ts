import GithubSlugger from "github-slugger";
import { defineHastPlugin, defineMdastPlugin, type HastNode } from "satteri";

export type MarkdownAlertType = "note" | "tip" | "important" | "warning" | "caution";

const alertIconPaths = {
	note: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
	tip: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z",
	important:
		"M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
	warning:
		"M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
	caution:
		"M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
} satisfies Record<MarkdownAlertType, string>;

export function markdownAlertIcon(type: MarkdownAlertType) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="${alertIconPaths[type]}"></path></svg>`;
}

const alertPattern = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][\t\p{Zs}]*((?:.*\S)?)[\t\p{Zs}]*\r?\n?([\s\S]*)/iu;

export const githubAlertsPlugin = defineMdastPlugin({
	name: "github-alerts",
	blockquote(node, ctx) {
		const paragraph = node.children[0];
		if (paragraph?.type !== "paragraph") return;

		const marker = paragraph.children[0];
		if (marker?.type !== "text") return;

		const match = marker.value.match(alertPattern);
		if (!match) return;

		const type = match[1].toLowerCase() as MarkdownAlertType;
		const title = match[2] || `${type[0].toUpperCase()}${type.slice(1)}`;
		const content = match[3];

		ctx.setProperty(node, "data", {
			hName: "div",
			hProperties: { className: ["markdown-alert", `markdown-alert-${type}`] }
		});

		if (content) {
			ctx.setProperty(marker, "value", content);
		} else if (paragraph.children.length === 1) {
			ctx.removeChildAt(node, 0);
		} else {
			ctx.removeChildAt(paragraph, 0);
		}

		ctx.prependChild(node, {
			type: "paragraph",
			data: { hProperties: { className: ["markdown-alert-title"] } },
			children: [
				{ type: "html", value: markdownAlertIcon(type) },
				{ type: "strong", children: [{ type: "text", value: title }] }
			]
		});
	}
});

declare module "satteri" {
	interface DataMap {
		tansanraoHeadingSlugger: GithubSlugger;
	}
}

const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];

export const headingIdsPlugin = defineHastPlugin({
	name: "heading-ids",
	element: {
		filter: headingTags,
		visit(node, ctx) {
			if (typeof node.properties.id === "string") return;

			const slugger = (ctx.data.tansanraoHeadingSlugger ??= new GithubSlugger());
			ctx.setProperty(node, "id", slugger.slug(ctx.textContent(node)));
		}
	}
});

export const footnoteLabelPlugin = defineHastPlugin({
	name: "footnote-label",
	element: {
		filter: ["h2"],
		visit(node) {
			if (node.properties.id !== "footnote-label") return;

			return {
				...node,
				tagName: "p",
				properties: { ...node.properties, className: ["hidden"] }
			};
		}
	}
});

export const headingSelfLinksPlugin = defineHastPlugin({
	name: "heading-self-links",
	element: {
		filter: headingTags,
		visit(node) {
			const id = node.properties.id;
			if (typeof id !== "string" || id === "footnote-label") return;
			if (node.children.length === 1 && node.children[0].type === "element" && node.children[0].tagName === "a") return;

			return {
				...node,
				children: [
					{
						type: "element",
						tagName: "a",
						properties: { href: `#${id}` },
						children: [...node.children]
					}
				]
			};
		}
	}
});

export const externalLinksPlugin = defineHastPlugin({
	name: "external-links",
	element: {
		filter: ["a"],
		visit(node, ctx) {
			const href = node.properties.href;
			if (typeof href !== "string" || !/^https?:\/\//iu.test(href)) return;

			ctx.setProperty(node, "target", "_blank");
			ctx.setProperty(node, "rel", ["nofollow", "noopener", "noreferrer"]);
		}
	}
});

export const imageFiguresPlugin = defineHastPlugin({
	name: "image-figures",
	element: {
		filter: ["p"],
		visit(node, ctx) {
			if (ctx.parent(node)?.type !== "root" || node.children.length !== 1) return;

			const image = node.children[0];
			if (image.type !== "element" || image.tagName !== "img") return;

			const { alt, src } = image.properties;
			if (typeof alt !== "string" || !alt || typeof src !== "string" || !src) return;

			return {
				type: "element",
				tagName: "figure",
				properties: {},
				children: [
					image,
					{
						type: "element",
						tagName: "figcaption",
						properties: {},
						children: [{ type: "text", value: alt }]
					}
				]
			};
		}
	}
});

export const tableWrapperPlugin = defineHastPlugin({
	name: "table-wrapper",
	element: {
		filter: ["table"],
		visit(node, ctx) {
			const parent = ctx.parent(node);
			if (
				parent?.type === "element" &&
				parent.tagName === "div" &&
				Array.isArray(parent.properties.className) &&
				parent.properties.className.includes("table-wrapper")
			) {
				return;
			}

			return {
				type: "element",
				tagName: "div",
				properties: { className: ["table-wrapper"] },
				children: [node]
			};
		}
	}
});

function codeCopyIcon(className: string, path: string): Extract<HastNode, { type: "element" }> {
	return {
		type: "element",
		tagName: "svg",
		properties: {
			className: [className],
			viewBox: "0 0 16 16",
			ariaHidden: "true"
		},
		children: [
			{
				type: "element",
				tagName: "path",
				properties: { d: path },
				children: []
			}
		]
	};
}

export const codeCopyPlugin = defineHastPlugin({
	name: "code-copy",
	element: {
		filter: ["pre"],
		visit(node, ctx) {
			const parent = ctx.parent(node);
			if (
				parent?.type === "element" &&
				parent.tagName === "div" &&
				Array.isArray(parent.properties.className) &&
				parent.properties.className.includes("code-container")
			) {
				return;
			}

			return {
				type: "element",
				tagName: "div",
				properties: { className: ["code-container"] },
				children: [
					node,
					{
						type: "element",
						tagName: "button",
						properties: {
							type: "button",
							className: ["code-copy-button"],
							ariaLabel: "Copy code",
							title: "Copy code"
						},
						children: [
							codeCopyIcon(
								"copy-icon",
								"M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Zm5-5C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
							),
							codeCopyIcon(
								"done-icon",
								"M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
							)
						]
					}
				]
			};
		}
	}
});

type HastElement = Extract<HastNode, { type: "element" }>;
type HastParent = Extract<HastNode, { children: unknown }>;

function isHeading(node: HastNode): node is HastElement {
	return node.type === "element" && headingTags.includes(node.tagName);
}

function sectionize(children: readonly HastNode[]) {
	const output: HastNode[] = [];
	const stack: Array<{ rank: number; children: HastNode[] }> = [{ rank: 0, children: output }];

	for (const child of children) {
		if (!isHeading(child)) {
			stack.at(-1)!.children.push(child);
			continue;
		}

		const rank = Number.parseInt(child.tagName.slice(1), 10);
		while (rank <= stack.at(-1)!.rank) stack.pop();

		const id = child.properties.id;
		const section: HastElement = {
			type: "element",
			tagName: "section",
			properties: {
				className: ["heading"],
				dataHeadingRank: rank,
				...(typeof id === "string" ? { ariaLabelledBy: id } : {})
			},
			children: [child]
		};

		stack.at(-1)!.children.push(section);
		stack.push({ rank, children: section.children as HastNode[] });
	}

	return output;
}

const sectionizedRoots = new WeakSet<object>();

export const sectionizePlugin = defineHastPlugin({
	name: "sectionize",
	element: {
		filter: headingTags,
		visit(node, ctx) {
			const parent = ctx.parent(node);
			if (parent?.type !== "root" || sectionizedRoots.has(parent)) return;

			sectionizedRoots.add(parent);
			ctx.setProperty(parent as HastParent, "children", sectionize(parent.children));
		}
	}
});

export const markdownMdastPlugins = [githubAlertsPlugin];
export const markdownHastPlugins = [
	headingIdsPlugin,
	footnoteLabelPlugin,
	headingSelfLinksPlugin,
	externalLinksPlugin,
	imageFiguresPlugin,
	tableWrapperPlugin,
	codeCopyPlugin,
	sectionizePlugin
];
