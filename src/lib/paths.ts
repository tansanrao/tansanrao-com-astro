interface PublishedEntry {
	id: string;
	data: {
		publishedAt: Date;
	};
}

export function writingEntryPath(entry: PublishedEntry) {
	const year = entry.data.publishedAt.getUTCFullYear();
	const month = String(entry.data.publishedAt.getUTCMonth() + 1).padStart(2, "0");
	return `/writing/${year}/${month}/${entry.id}`;
}

export function writingEntryRestParam(entry: PublishedEntry) {
	return writingEntryPath(entry).replace(/^\/writing\//, "");
}
