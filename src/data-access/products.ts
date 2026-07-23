"use server";

import { requireRole } from "@/lib/auth";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import {
	PRODUCT_LIST_DEFAULT_SORT,
	PRODUCT_LIST_SORT_COLUMNS,
	buildProductListWhere,
	productListHasActiveFilters,
} from "@/lib/domain/product-list-query";
import {
	PRODUCT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Product, type Prisma } from "@prisma/client";

const productInclude = {
	membership: true,
	entranceSet: true,
} satisfies Prisma.ProductInclude;

export type ProductWithSpecialization = Prisma.ProductGetPayload<{
	include: typeof productInclude;
}>;

export type ProductListResult = ListQueryResult<ProductWithSpecialization> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

export async function createProduct(input: Omit<Product, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("prodotti", "create", input);
	const { code } = input;
	return await db.product.create({
		data: {
			code,
		},
	});
}

/**
 * Server-side Prodotti list (ticket 23): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listProducts(
	input: ListQueryInput
): Promise<ProductListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildProductListWhere(
				params.filters
			) as Prisma.ProductWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, PRODUCT_LIST_DEFAULT_SORT) ??
				prismaOrderBy(PRODUCT_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = productListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.product.findMany({
					where,
					include: productInclude,
					orderBy,
					...skipTake,
				}),
				db.product.count({ where }),
				needsUnfiltered
					? db.product.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows, total };
		},
		{
			allowedSortColumns: PRODUCT_LIST_SORT_COLUMNS,
			defaultSort: PRODUCT_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listProducts} for the Prodotti page list. */
export async function getAllProducts() {
	await requireRole("Employee");
	return await db.product.findMany({
		include: productInclude,
	});
}

export async function getProduct(code: string) {
	await requireRole("Employee");
	return await db.product.findUnique({
		where: {
			code,
		},
		include: productInclude,
	});
}

export async function editProduct(input: Pick<Product, "code">) {
	await requireRole("Employee");
	assertAllowedMutation("prodotti", "update", input);
	const { code } = input;
	return await db.product.update({
		where: {
			code,
		},
		data: {
			code,
		},
	});
}

export async function deleteProduct({ code }: { code: string }) {
	await requireRole("Employee");
	try {
		return await db.product.delete({
			where: {
				code,
			},
		});
	} catch (error) {
		rethrowRestrictDelete(error, PRODUCT_HAS_PURCHASES_MESSAGE);
	}
}
