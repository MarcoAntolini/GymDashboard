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
import { EntranceSet, Prisma } from "@prisma/client";

const entranceSetInclude = { product: true } as const;

export type EntranceSetDTO = Prisma.EntranceSetGetPayload<{ include: typeof entranceSetInclude }>;

function intsFromEnumFilter(filter: ColumnFilter): number[] | undefined {
	const values = enumValues(filter);
	if (!values) return undefined;
	const ints = values
		.map((value) => Number.parseInt(value, 10))
		.filter((n) => Number.isFinite(n));
	return ints.length > 0 ? ints : undefined;
}

const entranceSetFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.EntranceSetWhereInput | undefined>
> = {
	productCode: (filter) => {
		const value = textContains(filter);
		return value ? { productCode: { contains: value } } : undefined;
	},
	entranceNumber: (filter) => {
		const values = intsFromEnumFilter(filter);
		return values ? { entranceNumber: { in: values } } : undefined;
	},
};

const entranceSetSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.EntranceSetOrderByWithRelationInput>
> = {
	productCode: (desc) => ({ productCode: desc ? "desc" : "asc" }),
	entranceNumber: (desc) => ({ entranceNumber: desc ? "desc" : "asc" }),
};

async function loadEntranceSetFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const where = buildWhere(filters, entranceSetFilterMap, { exclude: "entranceNumber" });
	const groups = await db.entranceSet.groupBy({
		by: ["entranceNumber"],
		where,
		_count: { _all: true },
		orderBy: { entranceNumber: "asc" },
	});
	return {
		entranceNumber: (
			groups as Array<{ entranceNumber: number; _count: { _all: number } }>
		).map((group) => ({
			value: String(group.entranceNumber),
			count: group._count._all,
		})),
	};
}

export async function createEntranceSet({
	productCode,
	entranceNumber,
}: Omit<EntranceSet, "id">) {
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

/** Server-paginated/filtered entrance-set list (ListQuery). */
export async function listEntranceSets(
	rawQuery: ListQuery
): Promise<ListResult<EntranceSetDTO>> {
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, entranceSetFilterMap);
	const orderBy = resolveOrderBy(query.sort, entranceSetSortMap, { productCode: "asc" });

	const [total, items, facets] = await Promise.all([
		db.entranceSet.count({ where }),
		db.entranceSet.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: entranceSetInclude,
		}),
		loadEntranceSetFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getEntranceSet(productCode: string) {
	return await db.entranceSet.findUnique({
		where: {
			productCode,
		},
		include: entranceSetInclude,
	});
}

export async function editEntranceSet({ productCode, entranceNumber }: EntranceSet) {
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

export async function deleteEntranceSet({ productCode }: { productCode: string }) {
	return await db.entranceSet.delete({
		where: {
			productCode,
		},
		include: entranceSetInclude,
	});
}
