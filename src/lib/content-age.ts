export function isOlderThanYears(date: Date, years: number, now = new Date()): boolean {
	const cutoff = new Date(now);
	cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
	return date < cutoff;
}
