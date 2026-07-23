"use server";

import { db } from "@/lib/db";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Membership, Prisma } from "@prisma/client";

const membershipInclude = { product: true } as const;

export type MembershipDTO = Prisma.MembershipGetPayload<{ include: typeof membershipInclude }>;

function intsFromEnumFilter(filter: ColumnFilter): number[] | undefined {
	const values = enumValues(filter);
	if (!values) return undefined;
	const ints = values
		.map((value) => Number.parseInt(value, 10))
		.filter((n) => Number.isFinite(n));
	return ints.length > 0 ? ints : undefined;
}

const membershipFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.MembershipWhereInput | undefined>
> = {
	productCode: (filter) => {
		const value = textContains(filter);
		return value ? { productCode: { contains: value } } : undefined;
	},
	duration: (filter) => {
		const values = intsFromEnumFilter(filter);
		return values ? { duration: { in: values } } : undefined;
	},
};

const membershipSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.MembershipOrderByWithRelationInput>
> = {
	productCode: (desc) => ({ productCode: desc ? "desc" : "asc" }),
	duration: (desc) => ({ duration: desc ? "desc" : "asc" }),
};

async function loadMembershipFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const where = buildWhere(filters, membershipFilterMap, { exclude: "duration" });
	const groups = await db.membership.groupBy({
		by: ["duration"],
		where,
		_count: { _all: true },
		orderBy: { duration: "asc" },
	});
	return {
		duration: (
			groups as Array<{ duration: number; _count: { _all: number } }>
		).map((group) => ({
			value: String(group.duration),
			count: group._count._all,
		})),
	};
}

export async function createMembership({
	productCode,
	duration,
}: Omit<Membership, "id">) {
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

/** Server-paginated/filtered membership list (ListQuery). */
export async function listMemberships(
	rawQuery: ListQuery
): Promise<ListResult<MembershipDTO>> {
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, membershipFilterMap);
	const orderBy = resolveOrderBy(query.sort, membershipSortMap, { productCode: "asc" });

	const [total, items, facets] = await Promise.all([
		db.membership.count({ where }),
		db.membership.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: membershipInclude,
		}),
		loadMembershipFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getMembership(productCode: string) {
	return await db.membership.findUnique({
		where: {
			productCode,
		},
		include: membershipInclude,
	});
}

export async function editMembership({ productCode, duration }: Membership) {
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

export async function deleteMembership({ productCode }: { productCode: string }) {
	return await db.membership.delete({
		where: {
			productCode,
		},
		include: membershipInclude,
	});
}
