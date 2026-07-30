import read from "reading-time";

export function getReadingStats(markdown: string | undefined) {
	return read(markdown ?? "");
}

export function getWordCount(markdown: string | undefined) {
	return getReadingStats(markdown).words;
}
