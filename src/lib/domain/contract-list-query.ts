/**
 * Contratti list-query helpers (ticket 29).
 *
 * Pure WHERE / sort contract for server-side Contratti lists — used by
 * `listContracts` in data-access. Filter keystrokes stay draft until Filtra.
 * Former faceted type filter becomes exact-match text (enum key or IT label).
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";
import { ContractType } from "@prisma/client";

export const CONTRACT_LIST_SORT_COLUMNS = [
	"employeeId",
	"type",
	"hourlyFee",
	"startingDate",
	"endingDate",
] as const;

export type ContractListSortColumn = (typeof CONTRACT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id dipendente (aligns with PK prefix + former filter focus). */
export const CONTRACT_LIST_DEFAULT_SORT: ListSort = {
	column: "employeeId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Contratti DataTable filters). */
export const CONTRACT_LIST_FILTER_IDS = ["employeeId", "type"] as const;

export type ContractListFilterId = (typeof CONTRACT_LIST_FILTER_IDS)[number];

/** Accept Prisma enum keys (FixedTerm) and DB/mapped labels (Tempo determinato). */
const TYPE_BY_LOWER = new Map<string, ContractType>();
for (const key of Object.keys(ContractType) as (keyof typeof ContractType)[]) {
	const value = ContractType[key];
	TYPE_BY_LOWER.set(key.toLowerCase(), value);
	TYPE_BY_LOWER.set(String(value).toLowerCase(), value);
}

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parseContractType(value: string): ContractType | null {
	return TYPE_BY_LOWER.get(value.toLowerCase()) ?? null;
}

function parseEmployeeId(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Prisma `where` for Contratti list filters.
 * employeeId/type: exact when parseable.
 */
export function buildContractListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const employeeIdRaw = filterString(filters.employeeId);
	if (employeeIdRaw !== null) {
		const employeeId = parseEmployeeId(employeeIdRaw);
		if (employeeId !== null) clauses.push({ employeeId });
	}

	const typeRaw = filterString(filters.type);
	if (typeRaw !== null) {
		const type = parseContractType(typeRaw);
		if (type !== null) clauses.push({ type });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function contractListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildContractListWhere(filters)).length > 0;
}
