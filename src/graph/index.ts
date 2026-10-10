import { readFile } from "node:fs/promises";

// Satori requires TTF/OTF/WOFF rather than the WOFF2 served to browsers.
export async function loadFont() {
	return readFile("public/fonts/HKGrotesk-Bold.ttf");
}
