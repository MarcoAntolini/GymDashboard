import type { ListFilters } from "@/lib/list";

export type HighlightSegment = {
	text: string;
	match: boolean;
};

/** Escape speciale regex per match letterale case-insensitive. */
function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueTerms(queries: string | string[]): string[] {
	const seen = new Set<string>();
	const terms: string[] = [];
	const list = Array.isArray(queries) ? queries : [queries];
	for (const raw of list) {
		const needle = raw.trim();
		if (!needle) continue;
		const key = needle.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		terms.push(needle);
	}
	return terms;
}

type MatchRange = { start: number; end: number };

function matchRanges(text: string, needles: string[]): MatchRange[] {
	const ranges: MatchRange[] = [];
	for (const needle of needles) {
		const re = new RegExp(escapeRegExp(needle), "gi");
		let match: RegExpExecArray | null;
		while ((match = re.exec(text)) !== null) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length,
			});
			if (match[0].length === 0) {
				re.lastIndex += 1;
			}
		}
	}
	ranges.sort((a, b) => a.start - b.start || b.end - a.end);
	const merged: MatchRange[] = [];
	for (const range of ranges) {
		const last = merged[merged.length - 1];
		if (last && range.start <= last.end) {
			last.end = Math.max(last.end, range.end);
		} else {
			merged.push({ ...range });
		}
	}
	return merged;
}

/**
 * Spezza `text` in segmenti match / non-match rispetto a uno o più termini
 * (case-insensitive). Usato per evidenziare i filtri testuali applicati.
 */
export function splitHighlightMatches(
	text: string,
	query: string | string[]
): HighlightSegment[] {
	if (!text) return [];
	const needles = uniqueTerms(query);
	if (needles.length === 0) {
		return [{ text, match: false }];
	}

	const ranges = matchRanges(text, needles);
	if (ranges.length === 0) {
		return [{ text, match: false }];
	}

	const segments: HighlightSegment[] = [];
	let lastIndex = 0;
	for (const range of ranges) {
		if (range.start > lastIndex) {
			segments.push({ text: text.slice(lastIndex, range.start), match: false });
		}
		segments.push({ text: text.slice(range.start, range.end), match: true });
		lastIndex = range.end;
	}
	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), match: false });
	}
	return segments;
}

function isTextFilterValue(value: ListFilters[string]): value is string | number {
	return value != null && !Array.isArray(value) && typeof value !== "boolean";
}

/**
 * Termini testuali da evidenziare. Senza `keys`: tutti i filtri stringa/numero
 * applicati (contains / eq id); ignora faceted (array) e boolean.
 */
export function stringFilterTerms(
	filters: ListFilters | undefined,
	keys?: string | string[]
): string[] {
	if (!filters) return [];
	const keyList = keys == null ? Object.keys(filters) : Array.isArray(keys) ? keys : [keys];
	const terms: string[] = [];
	for (const key of keyList) {
		const value = filters[key];
		if (!isTextFilterValue(value)) continue;
		const text = String(value).trim();
		if (text) terms.push(text);
	}
	return uniqueTerms(terms);
}

/**
 * Primo termine testuale per le chiavi indicate; null se assente.
 */
export function stringFilterTerm(
	filters: ListFilters | undefined,
	keys: string | string[]
): string | null {
	return stringFilterTerms(filters, keys)[0] ?? null;
}
