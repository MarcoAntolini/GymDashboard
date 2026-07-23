"use server";

import { requireRole } from "@/lib/auth";
import {
	BILL_LIST_DEFAULT_SORT,
	BILL_LIST_SORT_COLUMNS,
	billListHasActiveFilters,
	buildBillListWhere,
} from "@/lib/domain/bill-list-query";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Bill, Prisma } from "@prisma/client";

export async function createBill(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	assertAllowedMutation("bollette", "create", input);
	const { paymentId, description, provider } = input;
	return await db.bill.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export type BillListResult = ListQueryResult<Bill> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Bollette list (ticket 32): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listBills(
	input: ListQueryInput
): Promise<BillListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildBillListWhere(
				params.filters
			) as Prisma.BillWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, BILL_LIST_DEFAULT_SORT) ??
				prismaOrderBy(BILL_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = billListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.bill.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.bill.count({ where }),
				needsUnfiltered
					? db.bill.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows,
				total,
			};
		},
		{
			allowedSortColumns: BILL_LIST_SORT_COLUMNS,
			defaultSort: BILL_LIST_DEFAULT_SORT,
		}
	);

	return {
		...result,
		totalUnfiltered,
		emptyKind: listEmptyKind({
			totalUnfiltered,
			total: result.total,
			rowCount: result.rows.length,
		}),
	};
}

/** Full table — prefer {@link listBills} for the Bollette page list. */
export async function getAllBills() {
	await requireRole("Employee");
	return await db.bill.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getBill(paymentId: number) {
	await requireRole("Employee");
	return await db.bill.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editBill(input: Bill) {
	await requireRole("Employee");
	assertAllowedMutation("bollette", "update", input);
	const { paymentId, description, provider } = input;
	return await db.bill.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteBill({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.bill.delete({
		where: {
			paymentId,
		},
	});
}
