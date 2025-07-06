"use server";

import { db } from "@/lib/db";
import { Membership } from "@prisma/client";

export async function createMembership({
  productCode,
  duration,
}: Omit<Membership, "id">) {
  await await db.product.create({
		data: {
			code: productCode
		}
	});
  return await db.membership.create({
    data: {
      productCode,
      duration,
    },
    include: {
      product: true,
    },
  });
}

export async function getAllMemberships() {
  return await db.membership.findMany({
    include: {
      product: true,
    },
  });
}

export async function getMembership(productCode: string) {
  return await db.membership.findUnique({
    where: {
      productCode,
    },
    include: {
      product: true,
    },
  });
}

export async function editMembership({
  productCode,
  duration,
}: Membership) {
  return await db.membership.update({
    where: {
      productCode,
    },
    data: {
      duration,
    },
    include: {
      product: true,
    },
  });
}

export async function deleteMembership({ productCode }: { productCode: string }) {
  return await db.membership.delete({
    where: {
      productCode,
    },
  });
}