"use server";

import { requireRole } from "@/lib/auth";
import {
	INTERVENTION_LIST_DEFAULT_SORT,
	INTERVENTION_LIST_SORT_COLUMNS,
	buildInterventionListWhere,
	interventionListHasActiveFilters,
} from "@/lib/domain/intervention-list-query";
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
import { Intervention, Prisma } from "@prisma/client";

export async function createIntervention(input: {
	paymentId: number;
	description: string;
	maker: string;
	startingTime: Date;
	endingTime: Date;
}) {
	await requireRole("Employee");
	assertAllowedMutation("interventi", "create", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.create({
		data: {
			paymentId,
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export type InterventionListResult = ListQueryResult<Intervention> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Interventi list (ticket 34): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listInterventions(
	input: ListQueryInput
): Promise<InterventionListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildInterventionListWhere(
				params.filters
			) as Prisma.InterventionWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, INTERVENTION_LIST_DEFAULT_SORT) ??
				prismaOrderBy(INTERVENTION_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = interventionListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.intervention.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.intervention.count({ where }),
				needsUnfiltered
					? db.intervention.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows,
				total,
			};
		},
		{
			allowedSortColumns: INTERVENTION_LIST_SORT_COLUMNS,
			defaultSort: INTERVENTION_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listInterventions} for the Interventi page list. */
export async function getAllInterventions() {
	await requireRole("Employee");
	return await db.intervention.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getIntervention(paymentId: number) {
	await requireRole("Employee");
	return await db.intervention.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editIntervention(input: Intervention) {
	await requireRole("Employee");
	assertAllowedMutation("interventi", "update", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.update({
		where: {
			paymentId,
		},
		data: {
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function deleteIntervention({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.intervention.delete({
		where: {
			paymentId,
		},
	});
}
