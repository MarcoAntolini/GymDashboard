"use server";

import { db } from "@/lib/db";
import { Purchase, PurchaseType } from "@prisma/client";

export async function createPurchase({
  clientId,
  date,
  amount,
  type,
  productCode,
}: Omit<Purchase, "id">) {
  return await db.purchase.create({
    data: {
      clientId,
      date,
      amount,
      type,
      productCode,
    },
    include: {
      client: true,
      prodotto: true,
    },
  });
}

export async function getAllPurchases() {
  return await db.purchase.findMany({
    include: {
      client: true,
      prodotto: true,
    },
  });
}

export async function getPurchase(clientId: number, date: Date) {
  return await db.purchase.findUnique({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
    include: {
      client: true,
      prodotto: true,
    },
  });
}

export async function editPurchase({
  clientId,
  date,
  amount,
  type,
  productCode,
}: Purchase) {
  return await db.purchase.update({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
    data: {
      amount,
      type,
      productCode,
    },
    include: {
      client: true,
      prodotto: true,
    },
  });
}

export async function deletePurchase({ clientId, date }: { clientId: number; date: Date }) {
  return await db.purchase.delete({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
  });
}