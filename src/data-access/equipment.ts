"use server";

import { requireRole } from "@/lib/auth";
import {
	EQUIPMENT_LIST_DEFAULT_SORT,
	EQUIPMENT_LIST_SORT_COLUMNS,
	buildEquipmentListWhere,
	equipmentListHasActiveFilters,
} from "@/lib/domain/equipment-list-query";
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
import { Equipment, Prisma } from "@prisma/client";

export async function createEquipment(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	assertAllowedMutation("attrezzatura", "create", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export type EquipmentListResult = ListQueryResult<Equipment> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Attrezzatura list (ticket 33): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listEquipment(
	input: ListQueryInput
): Promise<EquipmentListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildEquipmentListWhere(
				params.filters
			) as Prisma.EquipmentWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, EQUIPMENT_LIST_DEFAULT_SORT) ??
				prismaOrderBy(EQUIPMENT_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = equipmentListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.equipment.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.equipment.count({ where }),
				needsUnfiltered
					? db.equipment.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows,
				total,
			};
		},
		{
			allowedSortColumns: EQUIPMENT_LIST_SORT_COLUMNS,
			defaultSort: EQUIPMENT_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listEquipment} for the Attrezzatura page list. */
export async function getAllEquipment() {
	await requireRole("Employee");
	return await db.equipment.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getEquipment(paymentId: number) {
	await requireRole("Employee");
	return await db.equipment.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editEquipment(input: Equipment) {
	await requireRole("Employee");
	assertAllowedMutation("attrezzatura", "update", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
