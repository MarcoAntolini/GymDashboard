/**
 * Pagamenti list-query helpers (ticket 35).
 *
 * Pure WHERE / sort contract for server-side Pagamenti lists — used by
 * `listPayments` in data-access. Filter keystrokes stay draft until Filtra.
 * Former faceted type filter becomes exact-match text (enum key or IT label).
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";
import { PaymentType } from "@prisma/client";

export const PAYMENT_LIST_SORT_COLUMNS = [
	"id",
	"date",
	"amount",
	"type",
] as const;

export type PaymentListSortColumn = (typeof PAYMENT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id (PK). */
export const PAYMENT_LIST_DEFAULT_SORT: ListSort = {
	column: "id",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Pagamenti DataTable filters). */
export const PAYMENT_LIST_FILTER_IDS = ["type"] as const;

export type PaymentListFilterId = (typeof PAYMENT_LIST_FILTER_IDS)[number];

/** Accept Prisma enum keys (Salary) and DB/mapped labels (Stipendio). */
const TYPE_BY_LOWER = new Map<string, PaymentType>();
for (const key of Object.keys(PaymentType) as (keyof typeof PaymentType)[]) {
	const value = PaymentType[key];
	TYPE_BY_LOWER.set(key.toLowerCase(), value);
	TYPE_BY_LOWER.set(String(value).toLowerCase(), value);
}

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parsePaymentType(value: string): PaymentType | null {
	return TYPE_BY_LOWER.get(value.toLowerCase()) ?? null;
}

/**
 * Prisma `where` for Pagamenti list filters.
 * type: exact when parseable as enum key or IT label.
 */
export function buildPaymentListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const typeRaw = filterString(filters.type);
	if (typeRaw !== null) {
		const type = parsePaymentType(typeRaw);
		if (type !== null) clauses.push({ type });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function paymentListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildPaymentListWhere(filters)).length > 0;
}
