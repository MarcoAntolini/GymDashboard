"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import {
	PRODUCT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { db } from "@/lib/db";
import { Product } from "@prisma/client";

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

export async function getAllProducts() {
	await requireRole("Employee");
  return await db.product.findMany({
    include: {
      membership: true,
      entranceSet: true,
    },
  });
}

export async function getProduct(code: string) {
	await requireRole("Employee");
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