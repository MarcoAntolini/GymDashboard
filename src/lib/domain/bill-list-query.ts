/**
 * Bollette list-query helpers (ticket 32).
 *
 * Pure WHERE / sort contract for server-side Bollette lists — used by
 * `listBills` in data-access. Filter keystrokes stay draft until Filtra.
 * Former client-side paymentId/provider filters become exact int / contains.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const BILL_LIST_SORT_COLUMNS = [
	"paymentId",
	"description",
	"provider",
] as const;

export type BillListSortColumn = (typeof BILL_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id pagamento (PK). */
export const BILL_LIST_DEFAULT_SORT: ListSort = {
	column: "paymentId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Bollette DataTable filters). */
export const BILL_LIST_FILTER_IDS = ["paymentId", "provider"] as const;

export type BillListFilterId = (typeof BILL_LIST_FILTER_IDS)[number];

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
 * Prisma `where` for Bollette list filters.
 * paymentId: exact when parseable; provider: contains.
 */
export function buildBillListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const paymentIdRaw = filterString(filters.paymentId);
	if (paymentIdRaw !== null) {
		const paymentId = parsePositiveInt(paymentIdRaw);
		if (paymentId !== null) clauses.push({ paymentId });
	}

	const provider = filterString(filters.provider);
	if (provider !== null) {
		clauses.push({ provider: { contains: provider } });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function billListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildBillListWhere(filters)).length > 0;
}
