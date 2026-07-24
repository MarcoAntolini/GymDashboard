"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

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
	price: Prisma.Decimal | number | string;
};

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
