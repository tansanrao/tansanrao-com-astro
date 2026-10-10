import { describe, expect, it } from "vitest";
import { writingEntryPath, writingEntryRestParam } from "./paths";

describe("writing entry paths", () => {
	it.each([
		["2020-09-08T04:30:00Z", "2020/09"],
		["2026-01-01T00:30:00+02:00", "2025/12"],
		["2025-12-31T23:30:00-02:00", "2026/01"]
	])("uses UTC year/month for %s", (date, prefix) => {
		const entry = { id: "nested/article", data: { publishedAt: new Date(date) } };
		expect(writingEntryPath(entry)).toBe(`/writing/${prefix}/nested/article`);
		expect(writingEntryRestParam(entry)).toBe(`${prefix}/nested/article`);
	});
});
