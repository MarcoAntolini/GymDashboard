"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { ProductKind } from "@/lib/domain/product-kind";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
} from "@/lib/list";
import {
	CATALOG_DEFAULT_SORT,
	CATALOG_FILTER_ALLOWLIST,
	CATALOG_SORT_ALLOWLIST,
} from "@/lib/list/catalogs";
import { Prisma } from "@prisma/client";

const PRODUCT_KINDS = new Set<string>(Object.values(ProductKind));

const catalogInclude = {
	product: {
		include: {
			membership: true,
			entranceSet: true,
		},
	},
} as const;

export type CatalogListRow = Prisma.CatalogGetPayload<{
	include: typeof catalogInclude;
}>;

type CatalogWriteInput = {
	year: number;
	productCode: string;
	price: Prisma.Decimal | number | string;
};

function parsePositiveIntFilter(raw: ListFilters[string]): number | undefined {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const n = Math.trunc(raw);
		return n > 0 ? n : undefined;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!/^\d+$/.test(trimmed)) return undefined;
		const n = Number.parseInt(trimmed, 10);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	}
	return undefined;
}

function parseProductKindFilter(
	raw: ListFilters[string]
): ProductKind | ProductKind[] | undefined {
	const collect = (entry: unknown): ProductKind | undefined => {
		if (typeof entry !== "string") return undefined;
		const value = entry.trim();
		if (!value || !PRODUCT_KINDS.has(value)) return undefined;
		return value as ProductKind;
	};

	if (Array.isArray(raw)) {
		const kinds = [
			...new Set(
				raw.map(collect).filter((kind): kind is ProductKind => kind !== undefined)
			),
		];
		if (kinds.length === 0) return undefined;
		return kinds.length === 1 ? kinds[0]! : kinds;
	}

	return collect(raw);
}

function productWhereForKind(kind: ProductKind): Prisma.ProductWhereInput {
	return kind === ProductKind.Membership
		? { membership: { isNot: null } }
		: { entranceSet: { isNot: null } };
}

function buildCatalogWhere(filters: ListFilters): Prisma.CatalogWhereInput {
	const where: Prisma.CatalogWhereInput = {};

	const year = parsePositiveIntFilter(filters.year);
	if (year !== undefined) where.year = year;

	const productCode = filters.productCode;
	if (typeof productCode === "string") {
		const value = productCode.trim();
		if (value) where.productCode = { contains: value };
	}

	const kind = parseProductKindFilter(filters.kind);
	if (kind !== undefined) {
		where.product = Array.isArray(kind)
			? { OR: kind.map(productWhereForKind) }
			: productWhereForKind(kind);
	}

	return where;
}

/**
 * Lista Listino server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listCatalogs(
	input: ListQueryInput = {}
): Promise<ListResult<CatalogListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: CATALOG_SORT_ALLOWLIST,
		filterAllowlist: CATALOG_FILTER_ALLOWLIST,
		defaultSort: [...CATALOG_DEFAULT_SORT],
	});
	const where = buildCatalogWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK composta (year, productCode).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "year" in o) ? [] : [{ year: "asc" as const }]),
		...(orderBy?.some((o) => "productCode" in o)
			? []
			: [{ productCode: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.catalog.count({ where }),
		db.catalog.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: catalogInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createCatalog(input: CatalogWriteInput) {
	assertMutationPayload("catalog", "create", input);
	const { year, productCode, price } = input;
	return await db.catalog.create({
		data: {
			year,
			productCode,
			price: new Prisma.Decimal(price),
		},
		include: catalogInclude,
	});
}

export async function getAllCatalogs() {
	return await db.catalog.findMany({
		include: catalogInclude,
	});
}

export async function getCatalog(year: number, productCode: string) {
	return await db.catalog.findUnique({
		where: {
			year_productCode: {
				year,
				productCode,
			},
		},
		include: catalogInclude,
	});
}

export async function editCatalog(input: CatalogWriteInput) {
	assertMutationPayload("catalog", "update", input);
	const { year, productCode, price } = input;
	return await db.catalog.update({
		where: {
			year_productCode: {
				year,
				productCode,
			},
		},
		data: {
			price: new Prisma.Decimal(price),
		},
		include: catalogInclude,
	});
}

export async function deleteCatalog({
	year,
	productCode,
}: {
	year: number;
	productCode: string;
}) {
	return await db.catalog.delete({
		where: {
			year_productCode: {
				year,
				productCode,
			},
		},
	});
}
