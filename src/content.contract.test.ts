import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";

// Exercise the real Astro loader, references, image schema, and publication filtering.
// Real photography routes/components use minimal shells without site chrome or fonts.
// The fixture never writes into the site's content.
const root = resolve(import.meta.dirname, "..");
const fixture = mkdtempSync(join(tmpdir(), "site-content-"));
function write(path: string, contents: string) {
	mkdirSync(join(fixture, path, ".."), { recursive: true });
	writeFileSync(join(fixture, path), contents);
}
function entry(collection: string, id: string, data: object) {
	write(`src/content/${collection}/${id}.md`, `---\n${JSON.stringify(data)}\n---\nFixture body.\n`);
}
function build() {
	return spawnSync(process.execPath, [join(root, "node_modules/astro/bin/astro.mjs"), "build", "--root", fixture], {
		cwd: fixture,
		encoding: "utf8",
		timeout: 30000
	});
}

beforeAll(() => {
	symlinkSync(join(root, "node_modules"), join(fixture, "node_modules"), "dir");
	write("package.json", '{"type":"module"}');
	write("astro.config.mjs", 'export default { site: "https://example.test", prerenderConflictBehavior: "error" };');
	write("src/pages/index.astro", "<h1>Content fixture</h1>");
	write(
		"tsconfig.json",
		JSON.stringify({
			compilerOptions: {
				baseUrl: ".",
				paths: {
					"$lib/*": ["src/lib/*"],
					"$components/*": ["src/components/*"],
					"$layouts/*": ["src/layouts/*"],
					"$styles/*": ["src/styles/*"]
				}
			}
		})
	);
	write("src/layouts/Base.astro", "<html><head><title>{Astro.props.title}</title></head><body><slot /></body></html>");
	write("src/components/Prose.astro", "<div data-prose><slot /></div>");
	write("src/styles/photography.css", "");
	for (const path of [
		"src/components/PhotoDetail.astro",
		"src/components/PhotoCollection.astro",
		"src/pages/photography/[...path].astro",
		"src/pages/photography/photos/[...id].astro"
	]) {
		write(path, readFileSync(join(root, path), "utf8"));
	}
	cpSync(join(root, "src/content.config.ts"), join(fixture, "src/content.config.ts"));
	write("src/lib/photography.ts", readFileSync(join(root, "src/lib/photography.ts"), "utf8"));
	cpSync(join(root, "src/images/profile.jpg"), join(fixture, "src/photo.jpg"));
	write("src/content/equipment/camera.yaml", "kind: camera\nname: Fixture camera\n");
	write("src/content/equipment/lens.yaml", "kind: lens\nname: Fixture lens\n");
	entry("photos", "dated", {
		image: "../../photo.jpg",
		alt: "Fixture portrait",
		publishedAt: "2026-03-02T01:00:00Z",
		takenOn: "2026-02-28",
		takenAt: "2026-02-28T23:30:00-05:00",
		camera: "camera",
		settings: { exposureCompensationEv: 0, exposureSeconds: 0.004 }
	});
	entry("photos", "undated", { image: "../../photo.jpg", alt: "Undated portrait", publishedAt: "2026-03-01T00:00:00Z" });
	entry("photos", "private", { image: "../../photo.jpg", alt: "Private portrait", publishedAt: "2026-03-01T00:00:00Z", draft: true });
	entry("photoCollections", "daily", {
		title: "Daily",
		kind: "daily",
		challenge: { startsOn: "2026-02-28", days: 2 },
		entries: [
			{ photo: "dated", day: "2026-02-28" },
			{ photo: "undated", day: "2026-03-01" }
		],
		cover: "dated"
	});
	entry("photoCollections", "album", {
		title: "Album",
		kind: "album",
		entries: [
			{ photo: "undated", slug: "undated" },
			{ photo: "dated", slug: "dated" }
		]
	});
	entry("photoCollections", "private", { title: "Private", kind: "album", entries: [{ photo: "private", slug: "private" }], draft: true });
	write(
		"src/pages/contract.json.ts",
		`
import { collections } from "../content.config";
import { getPhotography } from "../lib/photography";
export async function GET() {
  const graph = await getPhotography();
  const schema = collections.photoCollections.schema;
  const daily = { title: "Challenge", kind: "daily", challenge: { startsOn: "2024-02-28", days: 3 }, entries: [
    { photo: "dated", day: "2024-02-28" }, { photo: "undated", day: "2024-03-01" }
  ] };
  const accepts = value => schema.safeParse(value).success;
  return Response.json({
    photos: graph.photos.map(p => p.id).sort(),
    collections: graph.collections.map(c => c.id).sort(),
    takenOn: graph.photoById.get("dated").data.takenOn,
    undated: graph.photoById.get("undated").data.takenOn ?? null,
    albumOrder: graph.collections.find(c => c.id === "album").data.entries.map(e => e.photo.id),
    cases: {
      leapYearAndGap: accepts(daily),
      duplicateDay: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-28" }, { photo: "undated", day: "2024-02-28" }] }),
      beforeStart: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-27" }] }),
      afterEnd: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-03-02" }] }),
      invalidDate: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-30" }] }),
      missingChallenge: accepts({ ...daily, challenge: undefined }),
      missingDay: accepts({ ...daily, entries: [{ photo: "dated" }] }),
      duplicatePhoto: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-28" }, { photo: "dated", day: "2024-02-29" }] }),
      nonMemberCover: accepts({ ...daily, cover: "private" }),
      albumWithDay: accepts({ title: "Album", kind: "album", entries: [{ photo: "dated", day: "2024-02-28" }] }),
      albumWithoutSlug: accepts({ title: "Album", kind: "album", entries: [{ photo: "dated" }] }),
      invalidSlug: accepts({ title: "Album", kind: "album", entries: [{ photo: "dated", slug: "../escape" }] }),
      duplicateSlug: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-28", slug: "same" }, { photo: "undated", day: "2024-02-29", slug: "same" }] }),
      slugMatchesDay: accepts({ ...daily, entries: [{ photo: "dated", day: "2024-02-28", slug: "2024-02-29" }, { photo: "undated", day: "2024-02-29" }] })
    }
  });
}
`
	);
});

afterAll(() => rmSync(fixture, { recursive: true, force: true }));

it("loads real content, keeps capture dates and album order, hides drafts, and validates daily collection boundaries", () => {
	const result = build();
	expect(result.status, result.stdout + result.stderr).toBe(0);
	const output = JSON.parse(readFileSync(join(fixture, "dist/contract.json"), "utf8"));
	expect(output).toEqual({
		photos: ["dated", "undated"],
		collections: ["album", "daily"],
		takenOn: "2026-02-28",
		undated: null,
		albumOrder: ["undated", "dated"],
		cases: {
			leapYearAndGap: true,
			duplicateDay: false,
			beforeStart: false,
			afterEnd: false,
			invalidDate: false,
			missingChallenge: false,
			missingDay: false,
			duplicatePhoto: false,
			nonMemberCover: false,
			albumWithDay: false,
			albumWithoutSlug: false,
			invalidSlug: false,
			duplicateSlug: false,
			slugMatchesDay: false
		}
	});
}, 40000);

it("maps one nested source to different collection URLs with collection-local navigation", () => {
	entry("photos", "archive/center-for-the-arts", {
		image: "../../../photo.jpg",
		alt: "Shared center photograph",
		title: "Center for the Arts",
		publishedAt: "2026-10-13T00:00:00Z",
		takenOn: "2026-10-12"
	});
	entry("photoCollections", "365", {
		title: "365",
		kind: "daily",
		challenge: { startsOn: "2026-10-12", days: 365 },
		entries: [
			{ photo: "archive/center-for-the-arts", day: "2026-10-12" },
			{ photo: "dated", day: "2026-10-14" },
			{ photo: "undated", day: "2026-10-13" }
		]
	});
	entry("photoCollections", "virginia-tech", {
		title: "Virginia Tech",
		kind: "album",
		entries: [
			{ photo: "dated", slug: "campus" },
			{ photo: "archive/center-for-the-arts", slug: "center-for-the-arts" },
			{ photo: "undated", slug: "evening" }
		]
	});
	const result = build();
	expect(result.status, result.stdout + result.stderr).toBe(0);
	const page = (path: string) => readFileSync(join(fixture, `dist/photography/${path}/index.html`), "utf8");
	const daily = page("365/2026-10-12");
	const album = page("virginia-tech/center-for-the-arts");
	const hrefs = (html: string, rel: string) =>
		[...html.matchAll(/<a\b[^>]*>/g)].filter(([tag]) => tag.includes(`rel="${rel}"`)).map(([tag]) => tag.match(/href="([^"]+)"/)![1]);
	expect(hrefs(daily, "prev")).toEqual(["/photography/365/2026-10-13"]);
	expect(hrefs(daily, "next")).toEqual([]);
	expect(hrefs(album, "prev")).toEqual(["/photography/virginia-tech/campus"]);
	expect(hrefs(album, "next")).toEqual(["/photography/virginia-tech/evening"]);
	for (const html of [daily, album]) {
		expect(html).toContain('alt="Shared center photograph"');
		expect(html).toContain('href="/photography/365/2026-10-12"');
		expect(html).toContain('href="/photography/virginia-tech/center-for-the-arts"');
		expect(html).toContain("Fixture body.");
	}
	expect(daily.match(/<img\b[^>]*src="([^"]+)"/)![1]).toBe(album.match(/<img\b[^>]*src="([^"]+)"/)![1]);
	expect(daily).toContain('href="/photography/365"');
	expect(album).toContain('href="/photography/virginia-tech"');
	expect(daily).toMatch(/<h1[^>]*>Photo from 2026-10-12<\/h1>/);
	expect(album).toMatch(/<h1[^>]*>Center for the Arts<\/h1>/);
	expect(page("365")).toContain('href="/photography/365/2026-10-12"');
	expect(page("virginia-tech")).toContain('href="/photography/virginia-tech/center-for-the-arts"');
	expect(existsSync(join(fixture, "dist/photography/photos/archive/center-for-the-arts/index.html"))).toBe(false);
	expect(existsSync(join(fixture, "dist/photography/private/index.html"))).toBe(false);
}, 40000);

it("rejects collection files that resolve to the same content ID", () => {
	entry("photoCollections", "travel", { title: "Travel", kind: "album", entries: [{ photo: "dated", slug: "daylight" }] });
	try {
		for (const data of [
			{ title: "Other travel", kind: "album", entries: [{ photo: "undated", slug: "evening" }] },
			{ title: "Travel", kind: "album", entries: [{ photo: "dated", slug: "daylight" }] }
		]) {
			entry("photoCollections", "travel/index", data);
			const result = build();
			expect(result.status, result.stdout + result.stderr).toBe(1);
			expect(result.stdout + result.stderr).toContain('Duplicate content ID "travel" in photoCollections');
			expect(result.stdout + result.stderr).toContain("travel.md");
			expect(result.stdout + result.stderr).toContain("travel/index.md");
		}
		rmSync(join(fixture, "src/content/photoCollections/travel/index.md"));
		const recovered = build();
		expect(recovered.status, recovered.stdout + recovered.stderr).toBe(0);
	} finally {
		rmSync(join(fixture, "src/content/photoCollections/travel.md"));
		rmSync(join(fixture, "src/content/photoCollections/travel"), { recursive: true });
	}
}, 100000);

it("rejects a lens used as a camera and draft photos in a public collection", () => {
	entry("photos", "wrong-kind", { image: "../../photo.jpg", alt: "Wrong equipment", publishedAt: "2026-03-01T00:00:00Z", camera: "lens" });
	let result = build();
	expect(result.status).not.toBe(0);
	expect(result.stdout + result.stderr).toContain("camera must reference existing camera equipment (lens)");
	rmSync(join(fixture, "src/content/photos/wrong-kind.md"));
	entry("photoCollections", "exposed", { title: "Exposed", kind: "album", entries: [{ photo: "private", slug: "private" }] });
	result = build();
	expect(result.status).not.toBe(0);
	expect(result.stdout + result.stderr).toContain("publish photo private before including it in a public collection");
}, 60000);
