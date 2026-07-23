"use server";

import { db } from "@/lib/db";
import { Intervention } from "@prisma/client";

export async function createIntervention({
	paymentId,
	description,
	maker,
	startingTime,
	endingTime,
}: {
	paymentId: number;
	description: string;
	maker: string;
	startingTime: Date;
	endingTime: Date;
}) {
	return await db.intervention.create({
		data: {
			paymentId,
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function getAllInterventions() {
	return await db.intervention.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getIntervention(paymentId: number) {
	return await db.intervention.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editIntervention({ paymentId, description, maker, startingTime, endingTime }: Intervention) {
	return await db.intervention.update({
		where: {
			paymentId,
		},
		data: {
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function deleteIntervention({ paymentId }: { paymentId: number }) {
	return await db.intervention.delete({
		where: {
			paymentId,
		},
	});
}
