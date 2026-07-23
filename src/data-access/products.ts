"use server";

import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import {
	PRODUCT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { db } from "@/lib/db";
import { Product } from "@prisma/client";

export async function createProduct(input: Omit<Product, "id">) {
	assertAllowedMutation("prodotti", "create", input);
	const { code } = input;
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

export async function editProduct(input: Pick<Product, "code">) {
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