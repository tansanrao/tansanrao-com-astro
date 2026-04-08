import fs from "node:fs";
import path from "node:path";

// Directory to cache downloaded fonts
const CACHE_DIR = path.resolve(process.cwd(), "node_modules", ".cache", "og-fonts");

const fontUrl = "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSerif/unhinted/otf/NotoSerif-Bold.otf";

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/**
 * Load the font used for Open Graph images, downloading and caching it if necessary.
 * @returns ArrayBuffer of the font data
 */
export async function loadFont() {
	const fileName = path.basename(fontUrl);
	const filePath = path.join(CACHE_DIR, fileName);

	if (fs.existsSync(filePath)) return fs.promises.readFile(filePath).then(buffer => buffer.buffer);

	const response = await fetch(fontUrl);
	if (!response.ok) throw new Error(`Failed to load font from ${fontUrl}: ${response.status} ${response.statusText}`);

	const buffer = await response.arrayBuffer();
	await fs.promises.writeFile(filePath, new Uint8Array(buffer));

	return buffer;
}
