import type { CollectionEntry } from "astro:content";

export const bookStatus = { "to-read": "Want to read", reading: "Reading", read: "Finished", paused: "Paused", abandoned: "Did not finish" };
export type BookRead = { book: CollectionEntry<"books">; finishedOn?: string };

/** A shelf records completed reads, not purchases or additions to the site. */
export function getBookShelves(books: CollectionEntry<"books">[]) {
	const years = new Map<string, BookRead[]>();
	const undated: BookRead[] = [];
	for (const book of books) {
		if (book.data.draft) continue;
		const completed = book.data.readingSessions.filter(session => session.finishedOn);
		for (const session of completed) {
			const year = session.finishedOn!.slice(0, 4);
			const reads = years.get(year) ?? [];
			reads.push({ book, finishedOn: session.finishedOn });
			years.set(year, reads);
		}
		if (book.data.status === "read" && completed.length === 0) undated.push({ book });
	}
	const shelves = [...years]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([year, reads]) => ({
			label: `Finished in ${year}`,
			reads: reads.sort((a, b) => b.finishedOn!.localeCompare(a.finishedOn!) || a.book.data.title.localeCompare(b.book.data.title))
		}));
	if (undated.length)
		shelves.push({ label: "Finished · date unknown", reads: undated.sort((a, b) => a.book.data.title.localeCompare(b.book.data.title)) });
	return shelves;
}
