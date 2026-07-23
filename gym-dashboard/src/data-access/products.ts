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
import { Prisma, Product, PurchaseType } from "@prisma/client";

const productInclude = {
	membership: true,
	entranceSet: true,
} as const;

export type ProductDTO = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const KIND_MEMBERSHIP = PurchaseType.Membership;
const KIND_ENTRANCE_SET = PurchaseType.EntranceSet;

function kindWhere(values: string[]): Prisma.ProductWhereInput | undefined {
	const clauses: Prisma.ProductWhereInput[] = [];
	if (values.includes(KIND_MEMBERSHIP) || values.includes("Abbonamento")) {
		clauses.push({ membership: { isNot: null } });
	}
	if (
		values.includes(KIND_ENTRANCE_SET) ||
		values.includes("Pacchetto ingressi") ||
		values.includes("Pacchetto")
	) {
		clauses.push({ entranceSet: { isNot: null } });
	}
	if (clauses.length === 0) return undefined;
	if (clauses.length === 1) return clauses[0];
	return { OR: clauses };
}

const productFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.ProductWhereInput | undefined>
> = {
	code: (filter) => {
		const value = textContains(filter);
		return value ? { code: { contains: value } } : undefined;
	},
	kind: (filter) => {
		const values = enumValues(filter);
		return values ? kindWhere(values) : undefined;
	},
};

const productSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.ProductOrderByWithRelationInput>
> = {
	code: (desc) => ({ code: desc ? "desc" : "asc" }),
};

async function loadProductFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const whereWithoutKind = buildWhere(filters, productFilterMap, { exclude: "kind" });

	const [membershipCount, entranceSetCount] = await Promise.all([
		db.product.count({
			where: whereWithoutKind
				? { AND: [whereWithoutKind, { membership: { isNot: null } }] }
				: { membership: { isNot: null } },
		}),
		db.product.count({
			where: whereWithoutKind
				? { AND: [whereWithoutKind, { entranceSet: { isNot: null } }] }
				: { entranceSet: { isNot: null } },
		}),
	]);

	return {
		kind: [
			{ value: KIND_MEMBERSHIP, count: membershipCount },
			{ value: KIND_ENTRANCE_SET, count: entranceSetCount },
		].filter((option) => option.count > 0),
	};
}

export async function createProduct({ code }: Omit<Product, "id">) {
	await requireRole("Employee");
	return await db.product.create({
		data: {
			code,
		},
		include: productInclude,
	});
}

/** Full product catalog for form selects (catalogs / purchases), not list pages. */
export async function getAllProducts(): Promise<ProductDTO[]> {
	await requireRole("Employee");
	return await db.product.findMany({
		include: productInclude,
	});
}

/** Server-paginated/filtered product list (ListQuery). Kind via membership/entranceSet. */
export async function listProducts(rawQuery: ListQuery): Promise<ListResult<ProductDTO>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, productFilterMap);
	const orderBy = resolveOrderBy(query.sort, productSortMap, { code: "asc" });

	const [total, items, facets] = await Promise.all([
		db.product.count({ where }),
		db.product.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: productInclude,
		}),
		loadProductFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getProduct(code: string): Promise<ProductDTO | null> {
	await requireRole("Employee");
	return await db.product.findUnique({
		where: {
			code,
		},
		include: productInclude,
	});
}

export async function editProduct({ code }: Product): Promise<ProductDTO> {
	await requireRole("Employee");
	return await db.product.update({
		where: {
			code,
		},
		data: {
			code,
		},
		include: productInclude,
	});
}

export async function deleteProduct({ code }: { code: string }): Promise<ProductDTO> {
	await requireRole("Employee");
	return await db.product.delete({
		where: {
			code,
		},
		include: productInclude,
	});
}
