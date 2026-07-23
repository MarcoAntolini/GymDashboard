/**
 * Ingressi list-query helpers (ticket 21).
 *
 * Pure WHERE / sort contract for server-side Ingressi lists — used by
 * `listEntrances` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort, SortDirection } from "@/lib/domain/list-query";

export const ENTRANCE_LIST_SORT_COLUMNS = [
	"id",
	"client",
	"date",
	"purchase",
	"product",
] as const;

export type EntranceListSortColumn = (typeof ENTRANCE_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY data desc (matches former getAllEntrances). */
export const ENTRANCE_LIST_DEFAULT_SORT: ListSort = {
	column: "date",
	direction: "desc",
};

/** Search filters shown in ServerListToolbar. */
export const ENTRANCE_LIST_FILTER_IDS = [
	"dateFrom",
	"dateTo",
	"clientSurname",
	"clientName",
	"productCode",
	"purchaseId",
] as const;

export type EntranceListFilterId = (typeof ENTRANCE_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(ENTRANCE_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/** Parse `YYYY-MM-DD` into a UTC calendar day; invalid → null. */
function parseIsoDateOnly(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return date;
}

function endOfUtcDay(date: Date): Date {
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			23,
			59,
			59,
			999
		)
	);
}

/**
 * Prisma `where` for Ingressi list filters.
 * Join filters target Acquisto → Cliente / codice prodotto; date* are day bounds.
 */
export function buildEntranceListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];
	let dateGte: Date | undefined;
	let dateLte: Date | undefined;

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;

		switch (key as EntranceListFilterId) {
			case "clientName":
				clauses.push({
					purchase: { client: { name: { contains: value } } },
				});
				break;
			case "clientSurname":
				clauses.push({
					purchase: { client: { surname: { contains: value } } },
				});
				break;
			case "productCode":
				clauses.push({
					purchase: { productCode: { contains: value } },
				});
				break;
			case "purchaseId": {
				const id = Number.parseInt(value, 10);
				if (Number.isFinite(id) && String(id) === value) {
					clauses.push({ purchaseId: id });
				}
				break;
			}
			case "dateFrom": {
				const from = parseIsoDateOnly(value);
				if (from) dateGte = from;
				break;
			}
			case "dateTo": {
				const to = parseIsoDateOnly(value);
				if (to) dateLte = endOfUtcDay(to);
				break;
			}
		}
	}

	if (dateGte || dateLte) {
		const dateClause: Record<string, Date> = {};
		if (dateGte) dateClause.gte = dateGte;
		if (dateLte) dateClause.lte = dateLte;
		clauses.push({ date: dateClause });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function entranceListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildEntranceListWhere(filters)).length > 0;
}

type PrismaOrderBy = Record<string, unknown>;

/**
 * Prisma `orderBy` for Ingressi — supports join columns (Cliente, Prodotto)
 * and keeps `id` as a stable secondary key for pagination.
 */
export function buildEntranceListOrderBy(
	sort: ListSort | null
): PrismaOrderBy[] {
	const effective = sort ?? ENTRANCE_LIST_DEFAULT_SORT;
	const direction: SortDirection =
		effective.direction === "desc" ? "desc" : "asc";
	const column = effective.column as EntranceListSortColumn | string;

	switch (column) {
		case "id":
			return [{ id: direction }];
		case "date":
			return [{ date: direction }, { id: direction }];
		case "purchase":
			return [{ purchaseId: direction }, { id: direction }];
		case "client":
			return [
				{ purchase: { client: { surname: direction } } },
				{ purchase: { client: { name: direction } } },
				{ id: direction },
			];
		case "product":
			return [
				{ purchase: { productCode: direction } },
				{ id: direction },
			];
		default:
			return [
				{ [ENTRANCE_LIST_DEFAULT_SORT.column]: ENTRANCE_LIST_DEFAULT_SORT.direction },
				{ id: ENTRANCE_LIST_DEFAULT_SORT.direction },
			];
	}
}
