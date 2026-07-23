"use server";

import { db } from "@/lib/db";
import { Equipment } from "@prisma/client";

export async function createEquipment({
	paymentId,
	description,
	provider,
}: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	return await db.equipment.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function getAllEquipment() {
	return await db.equipment.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getEquipment(paymentId: number) {
	return await db.equipment.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editEquipment({ paymentId, description, provider }: Equipment) {
	return await db.equipment.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
