"use server";

import { requireRole } from "@/lib/auth";
import { listEmptyKind } from "@/lib/domain/list-query";
import {
	MEMBERSHIP_LIST_DEFAULT_SORT,
	MEMBERSHIP_LIST_SORT_COLUMNS,
	buildMembershipListWhere,
	membershipListHasActiveFilters,
} from "@/lib/domain/membership-list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Membership, type Prisma } from "@prisma/client";

const membershipInclude = {
	product: true,
} satisfies Prisma.MembershipInclude;

export type MembershipWithProduct = Prisma.MembershipGetPayload<{
	include: typeof membershipInclude;
}>;

export type MembershipListResult = ListQueryResult<MembershipWithProduct> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

export async function createMembership(input: Omit<Membership, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("abbonamenti", "create", input);
	const { productCode, duration } = input;
	await await db.product.create({
		data: {
			code: productCode,
		},
	});
	return await db.membership.create({
		data: {
			productCode,
			duration,
		},
		include: membershipInclude,
	});
}

/**
 * Server-side Abbonamenti list (ticket 24): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listMemberships(
	input: ListQueryInput
): Promise<MembershipListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildMembershipListWhere(
				params.filters
			) as Prisma.MembershipWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, MEMBERSHIP_LIST_DEFAULT_SORT) ??
				prismaOrderBy(MEMBERSHIP_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = membershipListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.membership.findMany({
					where,
					include: membershipInclude,
					orderBy,
					...skipTake,
				}),
				db.membership.count({ where }),
				needsUnfiltered
					? db.membership.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows, total };
		},
		{
			allowedSortColumns: MEMBERSHIP_LIST_SORT_COLUMNS,
			defaultSort: MEMBERSHIP_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listMemberships} for the Abbonamenti page list. */
export async function getAllMemberships() {
	await requireRole("Employee");
	return await db.membership.findMany({
		include: membershipInclude,
	});
}

export async function getMembership(productCode: string) {
	await requireRole("Employee");
	return await db.membership.findUnique({
		where: {
			productCode,
		},
		include: membershipInclude,
	});
}

export async function editMembership(input: Membership) {
	await requireRole("Employee");
	assertAllowedMutation("abbonamenti", "update", input);
	const { productCode, duration } = input;
	return await db.membership.update({
		where: {
			productCode,
		},
		data: {
			duration,
		},
		include: membershipInclude,
	});
}

export async function deleteMembership({
	productCode,
}: {
	productCode: string;
}) {
	await requireRole("Employee");
	return await db.membership.delete({
		where: {
			productCode,
		},
	});
}
