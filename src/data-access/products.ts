"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { throwIfRestrictViolation } from "@/lib/domain/prisma-restrict";
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
	PRODUCT_DEFAULT_SORT,
	PRODUCT_FILTER_ALLOWLIST,
	PRODUCT_SORT_ALLOWLIST,
} from "@/lib/list/products";
import { Prisma, Product } from "@prisma/client";

const PRODUCT_HAS_DEPENDENTS_MESSAGE =
	"Impossibile eliminare il Prodotto: esistono Acquisti o voci di Listino collegati (vincolo Restrict).";

const productInclude = {
	membership: true,
	entranceSet: true,
} as const;

export type ProductListRow = Prisma.ProductGetPayload<{
	include: typeof productInclude;
}>;

function buildProductWhere(filters: ListFilters): Prisma.ProductWhereInput {
	const where: Prisma.ProductWhereInput = {};
	const code = filters.code;
	if (typeof code === "string") {
		const value = code.trim();
		if (value) where.code = { contains: value };
	}
	return where;
}

/**
 * Lista Prodotti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listProducts(
	input: ListQueryInput = {}
): Promise<ListResult<ProductListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: PRODUCT_SORT_ALLOWLIST,
		filterAllowlist: PRODUCT_FILTER_ALLOWLIST,
		defaultSort: [...PRODUCT_DEFAULT_SORT],
	});
	const where = buildProductWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su code (PK stringa; evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "code" in o) ? [] : [{ code: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.product.count({ where }),
		db.product.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: productInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createProduct(input: Omit<Product, "id">) {
	assertMutationPayload("product", "create", input);
	const { code } = input;
	return await db.product.create({
		data: {
			code,
		},
	});
}

export async function getAllProducts() {
	return await db.product.findMany({
		include: productInclude,
	});
}

export async function getProduct(code: string) {
	return await db.product.findUnique({
		where: {
			code,
		},
		include: productInclude,
	});
}

export async function editProduct(input: Product) {
	assertMutationPayload("product", "update", input);
	const { code } = input;
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

export async function deleteProduct({ code }: { code: string }) {
	try {
		return await db.product.delete({
			where: {
				code,
			},
		});
	} catch (error) {
		throwIfRestrictViolation(error, PRODUCT_HAS_DEPENDENTS_MESSAGE);
	}
}
