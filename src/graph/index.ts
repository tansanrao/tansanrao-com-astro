import { readFile } from "node:fs/promises";
import satori, { type Font } from "satori";
import sharp from "sharp";
import tokens from "../styles/tokens.css?raw";

// The first color declarations are the light palette. Social images deliberately
// keep one theme, independently of the browser or social platform's theme.
function token(name: string) {
	const value = tokens.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1];
	if (!value) throw new Error(`Missing social-image token: ${name}`);
	return value.trim();
}

export const colors = {
	background: token("background-color"),
	ink: token("primary-color"),
	muted: token("secondary-color"),
	line: token("shadow-color"),
	accent: token("accent-color")
};
export const space = (step: number) => Number.parseFloat(token(`space-${step}`)) * 16;

// Satori does not support CSS variables or the font shorthand.
export function typography(role: "title" | "identity" | "meta") {
	const match = token(`type-social-${role}`).match(/^(\d+) (\d+)px \/ ([\d.]+) var\(--font-(sans|mono)\)$/);
	if (!match) throw new Error(`Invalid social-image typography: ${role}`);
	return {
		fontWeight: Number(match[1]),
		fontSize: Number(match[2]),
		lineHeight: Number(match[3]),
		fontFamily: match[4] === "mono" ? "IBM Plex Mono" : "HK Grotesk"
	};
}

type Style = Record<string, string | number>;
type Node = { type: string; props: { style?: Style; children?: string | Node[] } };

export function box(style: Style, children: string | Node[]): Node {
	return { type: "div", props: { style: { display: "flex", ...style }, children } };
}

export function canvas(children: Node[]) {
	return box(
		{
			width: "100%",
			height: "100%",
			padding: space(16),
			flexDirection: "column",
			background: colors.background,
			color: colors.ink,
			...typography("identity")
		},
		children
	);
}

// Bundle all image fonts: generating a card must not depend on a font CDN.
// Satori needs TTF/OTF/WOFF rather than the WOFF2 files used in the browser.
const fonts: Promise<Font[]> = Promise.all(
	[
		["HK Grotesk", 700, "HKGrotesk-Bold.ttf"],
		["HK Grotesk", 400, "HKGrotesk-Regular.ttf"],
		["IBM Plex Mono", 400, "IBMPlexMono-Regular.ttf"]
	].map(async ([name, weight, file]) => ({
		name: String(name),
		weight: weight as 400 | 700,
		style: "normal" as const,
		data: await readFile(`public/fonts/${file}`)
	}))
);

export async function titleBlock(title: string, width: number, maxHeight: number) {
	const style = typography("title");
	// Measure real glyphs and wrapping, rather than guessing from character count.
	// Only the headline shrinks; metadata and identity stay the same size.
	for (let fontSize = style.fontSize; fontSize >= style.fontSize / 2; fontSize -= 4) {
		const node = box({ ...style, fontSize, width, flexShrink: 0, wordBreak: "break-word" }, title);
		let height = 0;
		await satori(node, {
			width,
			fonts: await fonts,
			onNodeDetected: node => {
				height = Math.max(height, node.height);
			}
		});
		if (height <= maxHeight) return node;
	}
	throw new Error(`Social-image title is too long to fit legibly: ${title}`);
}

export async function renderImage(node: Node) {
	const svg = await satori(node, { width: 1200, height: 630, fonts: await fonts });
	return sharp(Buffer.from(svg)).png().toBuffer();
}
