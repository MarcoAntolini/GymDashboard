/**
 * Interventi list-query helpers (ticket 34).
 *
 * Pure WHERE / sort contract for server-side Interventi lists — used by
 * `listInterventions` in data-access. Filter keystrokes stay draft until Filtra.
 * Former client-side paymentId/maker filters become exact int / contains.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const INTERVENTION_LIST_SORT_COLUMNS = [
	"paymentId",
	"description",
	"maker",
	"startingTime",
	"endingTime",
] as const;

export type InterventionListSortColumn =
	(typeof INTERVENTION_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id pagamento (PK). */
export const INTERVENTION_LIST_DEFAULT_SORT: ListSort = {
	column: "paymentId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Interventi DataTable filters). */
export const INTERVENTION_LIST_FILTER_IDS = ["paymentId", "maker"] as const;

export type InterventionListFilterId =
	(typeof INTERVENTION_LIST_FILTER_IDS)[number];

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Prisma `where` for Interventi list filters.
 * paymentId: exact when parseable; maker: contains.
 */
export function buildInterventionListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const paymentIdRaw = filterString(filters.paymentId);
	if (paymentIdRaw !== null) {
		const paymentId = parsePositiveInt(paymentIdRaw);
		if (paymentId !== null) clauses.push({ paymentId });
	}

	const maker = filterString(filters.maker);
	if (maker !== null) {
		clauses.push({ maker: { contains: maker } });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function interventionListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildInterventionListWhere(filters)).length > 0;
}
