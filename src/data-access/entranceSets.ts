"use server";

import { requireRole } from "@/lib/auth";
import {
	ENTRANCE_SET_LIST_DEFAULT_SORT,
	ENTRANCE_SET_LIST_SORT_COLUMNS,
	buildEntranceSetListWhere,
	entranceSetListHasActiveFilters,
} from "@/lib/domain/entrance-set-list-query";
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
import { EntranceSet, type Prisma } from "@prisma/client";

const entranceSetInclude = {
	product: true,
} satisfies Prisma.EntranceSetInclude;

export type EntranceSetWithProduct = Prisma.EntranceSetGetPayload<{
	include: typeof entranceSetInclude;
}>;

export type EntranceSetListResult = ListQueryResult<EntranceSetWithProduct> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

export async function createEntranceSet(input: Omit<EntranceSet, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("pacchetti_ingressi", "create", input);
	const { productCode, entranceNumber } = input;
	await await db.product.create({
		data: {
			code: productCode,
		},
	});
	return db.entranceSet.create({
		data: {
			productCode,
			entranceNumber,
		},
		include: entranceSetInclude,
	});
}

/**
 * Server-side Pacchetti ingressi list (ticket 25): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listEntranceSets(
	input: ListQueryInput
): Promise<EntranceSetListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildEntranceSetListWhere(
				params.filters
			) as Prisma.EntranceSetWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, ENTRANCE_SET_LIST_DEFAULT_SORT) ??
				prismaOrderBy(ENTRANCE_SET_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = entranceSetListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.entranceSet.findMany({
					where,
					include: entranceSetInclude,
					orderBy,
					...skipTake,
				}),
				db.entranceSet.count({ where }),
				needsUnfiltered
					? db.entranceSet.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows, total };
		},
		{
			allowedSortColumns: ENTRANCE_SET_LIST_SORT_COLUMNS,
			defaultSort: ENTRANCE_SET_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listEntranceSets} for the Pacchetti ingressi page list. */
export async function getAllEntranceSets() {
	await requireRole("Employee");
	return await db.entranceSet.findMany({
		include: entranceSetInclude,
	});
}

export async function getEntranceSet(productCode: string) {
	await requireRole("Employee");
	return await db.entranceSet.findUnique({
		where: {
			productCode,
		},
		include: entranceSetInclude,
	});
}

export async function editEntranceSet(input: EntranceSet) {
	await requireRole("Employee");
	assertAllowedMutation("pacchetti_ingressi", "update", input);
	const { productCode, entranceNumber } = input;
	return await db.entranceSet.update({
		where: {
			productCode,
		},
		data: {
			entranceNumber,
		},
		include: entranceSetInclude,
	});
}

export async function deleteEntranceSet({
	productCode,
}: {
	productCode: string;
}) {
	await requireRole("Employee");
	return await db.entranceSet.delete({
		where: {
			productCode,
		},
	});
}
