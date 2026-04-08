interface TimestampedEntry {
	id: string;
	data: {
		timestamp: Date;
	};
}

export function blogEntryPath(entry: TimestampedEntry) {
	const year = entry.data.timestamp.getUTCFullYear();
	const month = String(entry.data.timestamp.getUTCMonth() + 1).padStart(2, "0");
	return `/blog/${year}/${month}/${entry.id}`;
}

export function blogEntryRestParam(entry: TimestampedEntry) {
	return blogEntryPath(entry).replace(/^\/blog\//, "");
}
