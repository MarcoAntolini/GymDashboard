/**
 * Abbonamenti list-query helpers (ticket 24).
 *
 * Pure WHERE / sort contract for server-side Abbonamenti lists — used by
 * `listMemberships` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const MEMBERSHIP_LIST_SORT_COLUMNS = ["productCode", "duration"] as const;

export type MembershipListSortColumn =
	(typeof MEMBERSHIP_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY codice_prodotto asc (PK / natural listing). */
export const MEMBERSHIP_LIST_DEFAULT_SORT: ListSort = {
	column: "productCode",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former memberships DataTable filters). */
export const MEMBERSHIP_LIST_FILTER_IDS = ["productCode", "duration"] as const;

export type MembershipListFilterId =
	(typeof MEMBERSHIP_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(MEMBERSHIP_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Abbonamenti list filters.
 * `productCode` is contains; `duration` is exact int when parseable.
 */
export function buildMembershipListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;

		switch (key as MembershipListFilterId) {
			case "productCode":
				clauses.push({ productCode: { contains: value } });
				break;
			case "duration": {
				const duration = Number.parseInt(value, 10);
				if (Number.isFinite(duration) && String(duration) === value) {
					clauses.push({ duration });
				}
				break;
			}
		}
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function membershipListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildMembershipListWhere(filters)).length > 0;
}
