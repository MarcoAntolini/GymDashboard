"use server";

import { requireRole } from "@/lib/auth";
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
import { Catalog, Prisma, PurchaseType } from "@prisma/client";

const catalogInclude = {
	product: {
		include: {
			membership: true,
			entranceSet: true,
		},
	},
} as const;

export type CatalogDTO = Prisma.CatalogGetPayload<{ include: typeof catalogInclude }>;

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function intsFromEnumFilter(filter: ColumnFilter): number[] | undefined {
	const values = enumValues(filter);
	if (!values) return undefined;
	const ints = values
		.map((value) => Number.parseInt(value, 10))
		.filter((n) => Number.isFinite(n));
	return ints.length > 0 ? ints : undefined;
}

function purchaseTypesFromFilter(filter: ColumnFilter): PurchaseType[] | undefined {
	const values = enumValues(filter);
	if (!values) return undefined;
	const types = values.filter(
		(value): value is PurchaseType =>
			value === PurchaseType.Membership || value === PurchaseType.EntranceSet
	);
	return types.length > 0 ? types : undefined;
}

/**
 * Catalog `type` is stored on the row; `kind` also accepts the same values and
 * maps via product membership / entranceSet specialization when type is absent
 * from a payload (forward-compatible with specialization-only UIs).
 */
function typeOrKindWhere(filter: ColumnFilter): Prisma.CatalogWhereInput | undefined {
	const types = purchaseTypesFromFilter(filter);
	if (types?.length) {
		return { type: { in: types } };
	}

	const values = enumValues(filter);
	if (!values?.length) return undefined;

	const clauses: Prisma.CatalogWhereInput[] = [];
	if (values.includes("Abbonamento")) {
		clauses.push({
			OR: [{ type: PurchaseType.Membership }, { product: { membership: { isNot: null } } }],
		});
	}
	if (values.includes("Pacchetto ingressi") || values.includes("Pacchetto")) {
		clauses.push({
			OR: [
				{ type: PurchaseType.EntranceSet },
				{ product: { entranceSet: { isNot: null } } },
			],
		});
	}
	if (clauses.length === 0) return undefined;
	if (clauses.length === 1) return clauses[0];
	return { OR: clauses };
}

const catalogFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.CatalogWhereInput | undefined>
> = {
	productCode: (filter) => {
		const value = textContains(filter);
		return value ? { productCode: { contains: value } } : undefined;
	},
	year: (filter) => {
		if (filter.kind === "text") {
			const year = intFromTextFilter(filter);
			return year != null ? { year } : undefined;
		}
		const years = intsFromEnumFilter(filter);
		return years ? { year: { in: years } } : undefined;
	},
	type: typeOrKindWhere,
	kind: typeOrKindWhere,
};

const catalogSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.CatalogOrderByWithRelationInput>
> = {
	year: (desc) => ({ year: desc ? "desc" : "asc" }),
	type: (desc) => ({ type: desc ? "desc" : "asc" }),
	productCode: (desc) => ({ productCode: desc ? "desc" : "asc" }),
	price: (desc) => ({ price: desc ? "desc" : "asc" }),
};

async function loadCatalogFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const [yearGroups, typeGroups] = await Promise.all([
		db.catalog.groupBy({
			by: ["year"],
			where: buildWhere(filters, catalogFilterMap, { exclude: "year" }),
			_count: { _all: true },
			orderBy: { year: "asc" },
		}),
		db.catalog.groupBy({
			by: ["type"],
			where: buildWhere(filters, catalogFilterMap, { exclude: "type" }),
			_count: { _all: true },
			orderBy: { type: "asc" },
		}),
	]);

	return {
		year: yearGroups.map((group: { year: number; _count: { _all: number } }) => ({
			value: String(group.year),
			count: group._count._all,
		})),
		type: typeGroups.map((group: { type: PurchaseType; _count: { _all: number } }) => ({
			value: String(group.type),
			count: group._count._all,
		})),
	};
}

export async function createCatalog({
	year,
	type,
	productCode,
	price,
}: Omit<Catalog, "id">) {
	await requireRole("Employee");
	return await db.catalog.create({
		data: {
			year,
			type,
			productCode,
			price,
		},
		include: catalogInclude,
	});
}

/** Server-paginated/filtered catalog list (ListQuery). */
export async function listCatalogs(rawQuery: ListQuery): Promise<ListResult<CatalogDTO>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, catalogFilterMap);
	const orderBy = resolveOrderBy(query.sort, catalogSortMap, { year: "desc" });

	const [total, items, facets] = await Promise.all([
		db.catalog.count({ where }),
		db.catalog.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: catalogInclude,
		}),
		loadCatalogFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getCatalog(year: number, type: PurchaseType, productCode: string) {
	await requireRole("Employee");
	return await db.catalog.findUnique({
		where: {
			year_type_productCode: {
				year,
				type,
				productCode,
			},
		},
		include: catalogInclude,
	});
}

export async function editCatalog({ year, type, productCode, price }: Catalog) {
	await requireRole("Employee");
	return await db.catalog.update({
		where: {
			year_type_productCode: {
				year,
				type,
				productCode,
			},
		},
		data: {
			price,
		},
		include: catalogInclude,
	});
}

export async function deleteCatalog({
	year,
	type,
	productCode,
}: {
	year: number;
	type: PurchaseType;
	productCode: string;
}) {
	await requireRole("Employee");
	return await db.catalog.delete({
		where: {
			year_type_productCode: {
				year,
				type,
				productCode,
			},
		},
		include: catalogInclude,
	});
}
