/**
 * Acquisti list-query helpers (ticket 22).
 *
 * Pure WHERE / sort contract for server-side Acquisti lists — used by
 * `listPurchases` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort, SortDirection } from "@/lib/domain/list-query";

export const PURCHASE_LIST_SORT_COLUMNS = [
	"id",
	"client",
	"date",
	"amount",
	"productCode",
	"duration",
	"entranceNumber",
] as const;

export type PurchaseListSortColumn = (typeof PURCHASE_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY data desc (matches former getAllPurchases). */
export const PURCHASE_LIST_DEFAULT_SORT: ListSort = {
	column: "date",
	direction: "desc",
};

/** Search filters shown in ServerListToolbar — human Cliente fields preferred (ticket 36). */
export const PURCHASE_LIST_FILTER_IDS = [
	"dateFrom",
	"dateTo",
	"clientSurname",
	"clientName",
	"productCode",
] as const;

export type PurchaseListFilterId = (typeof PURCHASE_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(PURCHASE_LIST_FILTER_IDS);

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
 * Prisma `where` for Acquisti list filters.
 * Join filters target Cliente; date* are day bounds.
 */
export function buildPurchaseListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];
	let dateGte: Date | undefined;
	let dateLte: Date | undefined;

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;

		switch (key as PurchaseListFilterId) {
			case "clientName":
				clauses.push({
					client: { name: { contains: value } },
				});
				break;
			case "clientSurname":
				clauses.push({
					client: { surname: { contains: value } },
				});
				break;
			case "productCode":
				clauses.push({
					productCode: { contains: value },
				});
				break;
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

export function purchaseListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildPurchaseListWhere(filters)).length > 0;
}

type PrismaOrderBy = Record<string, unknown>;

/**
 * Prisma `orderBy` for Acquisti — supports join Cliente and nativa/snapshot
 * columns; keeps `id` as a stable secondary key for pagination.
 * Derived `remainingEntrances` is not sortable (falls back to default).
 */
export function buildPurchaseListOrderBy(
	sort: ListSort | null
): PrismaOrderBy[] {
	const effective = sort ?? PURCHASE_LIST_DEFAULT_SORT;
	const direction: SortDirection =
		effective.direction === "desc" ? "desc" : "asc";
	const column = effective.column as PurchaseListSortColumn | string;

	switch (column) {
		case "id":
			return [{ id: direction }];
		case "date":
			return [{ date: direction }, { id: direction }];
		case "amount":
			return [{ amount: direction }, { id: direction }];
		case "productCode":
			return [{ productCode: direction }, { id: direction }];
		case "duration":
			return [{ duration: direction }, { id: direction }];
		case "entranceNumber":
			return [{ entranceNumber: direction }, { id: direction }];
		case "client":
			return [
				{ client: { surname: direction } },
				{ client: { name: direction } },
				{ id: direction },
			];
		default:
			return [
				{ [PURCHASE_LIST_DEFAULT_SORT.column]: PURCHASE_LIST_DEFAULT_SORT.direction },
				{ id: PURCHASE_LIST_DEFAULT_SORT.direction },
			];
	}
}
