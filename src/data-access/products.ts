"use server";

import { db } from "@/lib/db";
import { Prisma, Product } from "@prisma/client";

const PRODUCT_HAS_DEPENDENTS_MESSAGE =
	"Impossibile eliminare il prodotto: esistono acquisti collegati.";

export async function createProduct({
  code,
}: Omit<Product, "id">) {
  return await db.product.create({
    data: {
      code,
    },
  });
}

export async function getAllProducts() {
  return await db.product.findMany({
    include: {
      membership: true,
      entranceSet: true,
    },
  });
}

export async function getProduct(code: string) {
  return await db.product.findUnique({
    where: {
      code,
    },
    include: {
      membership: true,
      entranceSet: true,
    },
  });
}

export async function editProduct({
  code,
}: Product) {
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
	try {
		return await db.product.delete({
			where: {
				code,
			},
		});
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			(error.code === "P2003" || error.code === "P2014")
		) {
			throw new Error(PRODUCT_HAS_DEPENDENTS_MESSAGE);
		}
		throw error;
	}
}