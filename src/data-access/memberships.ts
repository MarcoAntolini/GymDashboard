"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Membership } from "@prisma/client";

export async function createMembership(input: Omit<Membership, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("abbonamenti", "create", input);
	const { productCode, duration } = input;
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
	await requireRole("Employee");
  return await db.membership.findMany({
    include: {
      product: true,
    },
  });
}

export async function getMembership(productCode: string) {
	await requireRole("Employee");
  return await db.membership.findUnique({
    where: {
      productCode,
    },
    include: {
      product: true,
    },
  });
}

export async function editMembership(input: Membership) {
	await requireRole("Employee");
	assertAllowedMutation("abbonamenti", "update", input);
	const { productCode, duration } = input;
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
	await requireRole("Employee");
  return await db.membership.delete({
    where: {
      productCode,
    },
  });
}