"use server";

import { db } from "@/lib/db";
import { Catalog, PurchaseType } from "@prisma/client";

export async function createCatalog({
  year,
  type,
  productCode,
  price,
}: Omit<Catalog, "id">) {
  return await db.catalog.create({
    data: {
      year,
      type,
      productCode,
      price,
    },
    include: {
      product: true,
    },
  });
}

export async function getAllCatalogs() {
  return await db.catalog.findMany({
    include: {
      product: true,
    },
  });
}

export async function getCatalog(year: number, type: PurchaseType, productCode: string) {
  return await db.catalog.findUnique({
    where: {
      year_type_productCode: {
        year,
        type,
        productCode,
      },
    },
    include: {
      product: true,
    },
  });
}

export async function editCatalog({
  year,
  type,
  productCode,
  price,
}: Catalog) {
  return await db.catalog.update({
    where: {
      year_type_productCode: {
        year,
        type,
        productCode,
      },
    },
    data: {
      price,
    },
    include: {
      product: true,
    },
  });
}

export async function deleteCatalog({ year, type, productCode }: { year: number; type: PurchaseType; productCode: string }) {
  return await db.catalog.delete({
    where: {
      year_type_productCode: {
        year,
        type,
        productCode,
      },
    },
  });
}