import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import sharp from "sharp";
import content from "./content";

// Vitest stubs CSS imports even with ?raw. Supply the actual stylesheet, as Vite
// does in production; fonts, Satori layout, and PNG rasterization stay real.
vi.mock("../styles/tokens.css?raw", () => ({ default: readFileSync("src/styles/tokens.css", "utf8") }));

it("keeps the masthead and date readable when a wide, long headline must wrap and shrink", async () => {
	const metadata = { author: "Tanuj Ravi Rao", domain: "tansanrao.com", type: "writing", time: "Jul 30, 2026" };
	const short = await content({ ...metadata, title: "XNU" });
	const long = await content({
		...metadata,
		title: "WWW and Wide Memory Mappings: What We Learned While Building, Measuring, and Maintaining Multi-Master Workloads Without Wasting Memory"
	});
	for (const image of [short, long]) {
		expect(await sharp(image).metadata()).toMatchObject({ format: "png", width: 1200, height: 630 });
	}
	// These regions must not move or get painted over by the variable headline.
	for (const region of [
		{ left: 0, top: 0, width: 1200, height: 150 },
		{ left: 0, top: 520, width: 1200, height: 110 }
	]) {
		const reference = await sharp(short).extract(region).raw().toBuffer();
		expect((await sharp(long).extract(region).raw().toBuffer()).equals(reference)).toBe(true);
	}
	expect(long.equals(short)).toBe(false);
});

it("uses the same layout for undated cards, with category at bottom left and an optional date at bottom right", async () => {
	const metadata = { author: "Tanuj Ravi Rao", domain: "tansanrao.com", title: "A work in progress" };
	const garden = await content({ ...metadata, type: "garden" });
	const building = await content({ ...metadata, type: "building" });
	const dated = await content({ ...metadata, type: "garden", time: "Jul 30, 2026" });
	for (const image of [garden, building, dated]) {
		expect(await sharp(image).metadata()).toMatchObject({ format: "png", width: 1200, height: 630 });
	}
	const body = { left: 0, top: 0, width: 1200, height: 520 };
	const reference = await sharp(garden).extract(body).raw().toBuffer();
	for (const image of [building, dated]) {
		expect((await sharp(image).extract(body).raw().toBuffer()).equals(reference)).toBe(true);
	}
	const category = { left: 64, top: 520, width: 400, height: 60 };
	const label = await sharp(garden).extract(category).raw().toBuffer();
	expect((await sharp(building).extract(category).raw().toBuffer()).equals(label)).toBe(false);
	expect((await sharp(dated).extract(category).raw().toBuffer()).equals(label)).toBe(true);
	const date = { left: 800, top: 520, width: 336, height: 60 };
	const emptyDate = await sharp(garden).extract(date).raw().toBuffer();
	const background = await sharp(garden)
		.extract({ ...date, top: 0 })
		.raw()
		.toBuffer();
	expect(emptyDate.equals(background)).toBe(true);
	expect((await sharp(dated).extract(date).raw().toBuffer()).equals(emptyDate)).toBe(false);
});
