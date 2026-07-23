"use server";

import { requireRole } from "@/lib/auth";
import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { deriveProductKind, type ProductKind } from "@/lib/domain/product-kind";
import { db } from "@/lib/db";
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
