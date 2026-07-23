"use server";

import { db } from "@/lib/db";
import { Product } from "@prisma/client";

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
  return await db.product.delete({
    where: {
      code,
    },
  });
}