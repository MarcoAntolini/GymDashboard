"use server";

import { requireRole } from "@/lib/auth";
import {
	CLOCKING_LIST_DEFAULT_SORT,
	CLOCKING_LIST_SORT_COLUMNS,
	buildClockingListWhere,
	clockingListHasActiveFilters,
} from "@/lib/domain/clocking-list-query";
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
import { Clocking, Prisma } from "@prisma/client";

export async function createClocking(input: {
	employeeId: number;
	entranceTime: Date;
	exitTime?: Date;
}) {
	await requireRole("Admin");
	assertAllowedMutation("timbrature", "create", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.create({
		data: {
			employeeId,
			entranceTime,
			exitTime,
		},
	});
}

export type ClockingListResult = ListQueryResult<Clocking> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Timbrature list (ticket 30): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listClockings(
	input: ListQueryInput
): Promise<ClockingListResult> {
	await requireRole("Admin");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildClockingListWhere(
				params.filters
			) as Prisma.ClockingWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, CLOCKING_LIST_DEFAULT_SORT) ??
				prismaOrderBy(CLOCKING_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = clockingListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.clocking.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.clocking.count({ where }),
				needsUnfiltered
					? db.clocking.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows,
				total,
			};
		},
		{
			allowedSortColumns: CLOCKING_LIST_SORT_COLUMNS,
			defaultSort: CLOCKING_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listClockings} for the Timbrature page list. */
export async function getAllClockings() {
	await requireRole("Admin");
	return await db.clocking.findMany();
}

export async function getClocking(employeeId: number, entranceTime: Date) {
	await requireRole("Admin");
	return await db.clocking.findUnique({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}

export async function editClocking(input: Clocking) {
	await requireRole("Admin");
	assertAllowedMutation("timbrature", "update", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.update({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
		data: {
			exitTime,
		},
	});
}

export async function deleteClocking({ employeeId, entranceTime }: { employeeId: number; entranceTime: Date }) {
	await requireRole("Admin");
	return await db.clocking.delete({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}
