/**
 * Attrezzatura list-query helpers (ticket 33).
 *
 * Pure WHERE / sort contract for server-side Attrezzatura lists — used by
 * `listEquipment` in data-access. Filter keystrokes stay draft until Filtra.
 * Former client-side paymentId/provider filters become exact int / contains.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const EQUIPMENT_LIST_SORT_COLUMNS = [
	"paymentId",
	"description",
	"provider",
] as const;

export type EquipmentListSortColumn =
	(typeof EQUIPMENT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id pagamento (PK). */
export const EQUIPMENT_LIST_DEFAULT_SORT: ListSort = {
	column: "paymentId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Attrezzatura DataTable filters). */
export const EQUIPMENT_LIST_FILTER_IDS = ["paymentId", "provider"] as const;

export type EquipmentListFilterId =
	(typeof EQUIPMENT_LIST_FILTER_IDS)[number];

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
 * Prisma `where` for Attrezzatura list filters.
 * paymentId: exact when parseable; provider: contains.
 */
export function buildEquipmentListWhere(
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

export function equipmentListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildEquipmentListWhere(filters)).length > 0;
}
