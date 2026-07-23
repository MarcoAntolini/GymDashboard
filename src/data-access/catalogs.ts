"use server";

import { requireRole } from "@/lib/auth";
import {
	CATALOG_LIST_DEFAULT_SORT,
	CATALOG_LIST_SORT_COLUMNS,
	buildCatalogListWhere,
	catalogListHasActiveFilters,
} from "@/lib/domain/catalog-list-query";
import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { deriveProductKind, type ProductKind } from "@/lib/domain/product-kind";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Catalog, Prisma } from "@prisma/client";

/**
 * Listino list/detail DTO — column classes (see VIEW_COLUMN_MATRIX.listino):
 * - nativa: year, productCode, price
 * - derivata: productKind
 * - join: product
 */
export type CatalogRow = {
	year: number;
	productCode: string;
	/** nativa — 2-decimal string for forms/display (Decimal end-to-end via Prisma write). */
	price: string;
	/** derivata — from Prodotto specialization; never persisted on Listino. */
	productKind: ProductKind | null;
	/** join — Prodotto + ISA for kind derivation / labels */
	product: {
		code: string;
		membership: { duration: number } | null;
		entranceSet: { entranceNumber: number } | null;
	};
};

type CatalogWithProduct = Catalog & {
	product: {
		code: string;
		membership: { duration: number } | null;
		entranceSet: { entranceNumber: number } | null;
	};
};

function toCatalogRow(catalog: CatalogWithProduct): CatalogRow {
	return {
		year: catalog.year,
		productCode: catalog.productCode,
		price: formatCatalogPrice(catalog.price),
		productKind: deriveProductKind(catalog.product),
		product: catalog.product,
	};
}

const catalogInclude = {
	product: {
		include: {
			membership: true,
			entranceSet: true,
		},
	},
} as const;

type CatalogWriteInput = {
	year: number;
	productCode: string;
	price: string | number | Prisma.Decimal;
};

export async function createCatalog(input: CatalogWriteInput): Promise<CatalogRow> {
	await requireRole("Employee");
	assertAllowedMutation("listino", "create", input);
	const { year, productCode, price } = input;
	const created = await db.catalog.create({
		data: {
			year,
			productCode,
			price: new Prisma.Decimal(price),
		},
		include: catalogInclude,
	});
	return toCatalogRow(created);
}

export type CatalogListResult = ListQueryResult<CatalogRow> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Listino list (ticket 26): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listCatalogs(
	input: ListQueryInput
): Promise<CatalogListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildCatalogListWhere(
				params.filters
			) as Prisma.CatalogWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, CATALOG_LIST_DEFAULT_SORT) ??
				prismaOrderBy(CATALOG_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = catalogListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.catalog.findMany({
					where,
					include: catalogInclude,
					orderBy,
					...skipTake,
				}),
				db.catalog.count({ where }),
				needsUnfiltered
					? db.catalog.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows: rows.map(toCatalogRow), total };
		},
		{
			allowedSortColumns: CATALOG_LIST_SORT_COLUMNS,
			defaultSort: CATALOG_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listCatalogs} for the Listino page list. */
export async function getAllCatalogs(): Promise<CatalogRow[]> {
	await requireRole("Employee");
	const catalogs = await db.catalog.findMany({
		include: catalogInclude,
		orderBy: [{ year: "desc" }, { productCode: "asc" }],
	});
	return catalogs.map(toCatalogRow);
}

export async function getCatalog(
	year: number,
	productCode: string
): Promise<CatalogRow | null> {
	await requireRole("Employee");
	const catalog = await db.catalog.findUnique({
		where: {
			year_productCode: {
				year,
				productCode,
			},
		},
		include: catalogInclude,
	});
	return catalog ? toCatalogRow(catalog) : null;
}

export async function editCatalog(input: CatalogWriteInput): Promise<CatalogRow> {
	await requireRole("Employee");
	assertAllowedMutation("listino", "update", input);
	const { year, productCode, price } = input;
	const updated = await db.catalog.update({
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
	return toCatalogRow(updated);
}

export async function deleteCatalog({
	year,
	productCode,
}: {
	year: number;
	productCode: string;
}): Promise<Catalog> {
	await requireRole("Employee");
	return await db.catalog.delete({
		where: {
			year_productCode: {
				year,
				productCode,
			},
		},
	});
}
