import type { ListFilters } from "@/lib/list";

export type HighlightSegment = {
	text: string;
	match: boolean;
};

/** Escape speciale regex per match letterale case-insensitive. */
function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Spezza `text` in segmenti match / non-match rispetto a `query` (case-insensitive).
 * Usato per evidenziare i termini dei filtri server-side applicati sulla pagina corrente.
 */
export function splitHighlightMatches(text: string, query: string): HighlightSegment[] {
	const needle = query.trim();
	if (!text || !needle) {
		return text ? [{ text, match: false }] : [];
	}

	const re = new RegExp(escapeRegExp(needle), "gi");
	const segments: HighlightSegment[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = re.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ text: text.slice(lastIndex, match.index), match: false });
		}
		segments.push({ text: match[0], match: true });
		lastIndex = match.index + match[0].length;
		if (match[0].length === 0) {
			re.lastIndex += 1;
		}
	}

	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), match: false });
	}

	return segments.length > 0 ? segments : [{ text, match: false }];
}

/**
 * Termine testuale da evidenziare per una o più chiavi filtro applicate.
 * Solo stringhe/numeri (contains / eq id); ignora faceted (array) e boolean.
 */
export function stringFilterTerm(
	filters: ListFilters | undefined,
	keys: string | string[]
): string | null {
	if (!filters) return null;
	const keyList = Array.isArray(keys) ? keys : [keys];
	for (const key of keyList) {
		const value = filters[key];
		if (value == null || Array.isArray(value) || typeof value === "boolean") {
			continue;
		}
		const text = String(value).trim();
		if (text) return text;
	}
	return null;
}
