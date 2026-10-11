import type { CollectionEntry } from "astro:content";
import { expect, it } from "vitest";
import { getBookShelves } from "./books";

function book(id: string, data: Partial<CollectionEntry<"books">["data"]> = {}): CollectionEntry<"books"> {
	return {
		id,
		collection: "books",
		data: {
			title: id,
			authors: ["Author"],
			status: "read",
			addedAt: new Date("2030-01-01"),
			tags: [],
			readingSessions: [],
			draft: false,
			...data
		}
	};
}

it("shelves completed reads by finish date, preserving rereads and unknown dates without inventing completions", () => {
	const shelves = getBookShelves([
		book("rereading", {
			status: "reading",
			readingSessions: [{ finishedOn: "2024-12-31" }, { finishedOn: "2026-01-01" }, { startedOn: "2026-06-01" }]
		}),
		book("later", { readingSessions: [{ finishedOn: "2026-03-02" }] }),
		book("unknown"),
		book("wishlist", { status: "to-read" }),
		book("paused", { status: "paused", readingSessions: [{ startedOn: "2025-01-01" }] }),
		book("draft", { draft: true, readingSessions: [{ finishedOn: "2027-01-01" }] })
	]);
	expect(shelves.map(shelf => ({ label: shelf.label, reads: shelf.reads.map(read => [read.book.id, read.finishedOn ?? null]) }))).toEqual([
		{
			label: "Finished in 2026",
			reads: [
				["later", "2026-03-02"],
				["rereading", "2026-01-01"]
			]
		},
		{ label: "Finished in 2024", reads: [["rereading", "2024-12-31"]] },
		{ label: "Finished · date unknown", reads: [["unknown", null]] }
	]);
});
