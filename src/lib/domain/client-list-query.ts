/**
 * Clienti list-query helpers (ticket 20).
 *
 * Pure WHERE / sort contract for server-side Clienti lists — used by
 * `listClients` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const CLIENT_LIST_SORT_COLUMNS = [
	"id",
	"taxCode",
	"name",
	"surname",
	"birthDate",
	"city",
	"province",
	"enrollmentDate",
] as const;

export type ClientListSortColumn = (typeof CLIENT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY cognome (aligns with LIST_INDEX_CANDIDATES for clienti). */
export const CLIENT_LIST_DEFAULT_SORT: ListSort = {
	column: "surname",
	direction: "asc",
};

/** Text filters shown in ServerListToolbar (former client DataTable filters). */
export const CLIENT_LIST_FILTER_IDS = [
	"taxCode",
	"name",
	"surname",
	"city",
	"province",
] as const;

export type ClientListFilterId = (typeof CLIENT_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(CLIENT_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Clienti list filters.
 * Only known text filter ids are applied (contains); blank/unknown ignored.
 */
export function buildClientListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;
		clauses.push({ [key]: { contains: value } });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function clientListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildClientListWhere(filters)).length > 0;
}
