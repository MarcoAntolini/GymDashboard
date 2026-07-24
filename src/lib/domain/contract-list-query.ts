/**
 * Contratti list-query helpers (ticket 29 + 36 human filters).
 *
 * Pure WHERE / sort contract for server-side Contratti lists — used by
 * `listContracts` in data-access. Filter keystrokes stay draft until Filtra.
 * Former faceted type filter becomes exact-match text (enum key or IT label).
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";
import { ContractType } from "@prisma/client";

export const CONTRACT_LIST_SORT_COLUMNS = [
	"employeeId",
	"employee",
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

/**
 * Search filters: prefer Dipendente name fields over opaque employeeId (ticket 36).
 */
export const CONTRACT_LIST_FILTER_IDS = [
	"employeeSurname",
	"employeeName",
	"type",
] as const;

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

/**
 * Prisma `where` for Contratti list filters.
 * employeeSurname/employeeName: contains on join; type: exact when parseable.
 */
export function buildContractListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const surnameRaw = filterString(filters.employeeSurname);
	if (surnameRaw !== null) {
		clauses.push({ employee: { surname: { contains: surnameRaw } } });
	}

	const nameRaw = filterString(filters.employeeName);
	if (nameRaw !== null) {
		clauses.push({ employee: { name: { contains: nameRaw } } });
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

type PrismaOrderBy = Record<string, unknown>;

/**
 * Prisma `orderBy` for Contratti — supports Dipendente join label sort.
 */
export function buildContractListOrderBy(
	sort: ListSort | null
): PrismaOrderBy | PrismaOrderBy[] {
	const effective = sort ?? CONTRACT_LIST_DEFAULT_SORT;
	const direction = effective.direction === "desc" ? "desc" : "asc";
	const column = effective.column as ContractListSortColumn | string;

	switch (column) {
		case "employee":
			return [
				{ employee: { surname: direction } },
				{ employee: { name: direction } },
				{ startingDate: direction },
			];
		case "type":
			return { type: direction };
		case "hourlyFee":
			return { hourlyFee: direction };
		case "startingDate":
			return { startingDate: direction };
		case "endingDate":
			return { endingDate: direction };
		case "employeeId":
		default:
			return [{ employeeId: direction }, { startingDate: direction }];
	}
}
