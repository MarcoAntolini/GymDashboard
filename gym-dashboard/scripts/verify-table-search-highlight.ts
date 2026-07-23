/**
 * Verify render-only search highlight helpers (no DB / React runtime).
 * Run: npx tsx scripts/verify-table-search-highlight.ts
 */
import assert from "node:assert/strict";

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectTextSearchTerms(
	columnFilters: Array<{ id: string; value: unknown }>,
	textFilterIds: string[]
): string[] {
	const textSet = new Set(textFilterIds);
	const terms: string[] = [];
	for (const filter of columnFilters) {
		if (!textSet.has(filter.id)) continue;
		if (typeof filter.value !== "string") continue;
		const trimmed = filter.value.trim();
		if (trimmed) terms.push(trimmed);
	}
	return terms;
}

function highlightSegments(text: string, terms: string[]): Array<{ text: string; match: boolean }> {
	const usable = terms.map((t) => t.trim()).filter(Boolean);
	if (!usable.length || !text) return [{ text, match: false }];

	const pattern = new RegExp(`(${usable.map(escapeRegExp).join("|")})`, "gi");
	const parts = text.split(pattern);
	const lowerTerms = usable.map((t) => t.toLowerCase());
	return parts
		.filter((part) => part.length > 0)
		.map((part) => ({
			text: part,
			match: lowerTerms.some((t) => part.toLowerCase() === t),
		}));
}

const terms = collectTextSearchTerms(
	[
		{ id: "name", value: "Mar" },
		{ id: "city", value: ["Roma"] },
		{ id: "surname", value: "  " },
	],
	["name", "surname"]
);
assert.deepEqual(terms, ["Mar"]);

const segments = highlightSegments("Marco Rossi", ["mar"]);
assert.equal(segments.filter((s) => s.match).length, 1);
assert.equal(segments.find((s) => s.match)?.text, "Mar");
assert.ok(segments.some((s) => s.text === "co Rossi" && !s.match));

const escaped = highlightSegments("a+b (test)", ["a+b"]);
assert.equal(escaped.filter((s) => s.match).map((s) => s.text).join(""), "a+b");

const multi = highlightSegments("Anna Maria", ["an", "maria"]);
assert.deepEqual(
	multi.filter((s) => s.match).map((s) => s.text.toLowerCase()),
	["an", "maria"]
);

console.log("verify-table-search-highlight: ok");
