"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Clocking } from "@prisma/client";

export async function createClocking(input: {
	employeeId: number;
	entranceTime: Date;
	exitTime?: Date;
}) {
	await requireRole("Admin");
	assertMutationPayload("clocking", "create", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.create({
		data: {
			employeeId,
			entranceTime,
			exitTime,
		},
	});
}

export async function getAllClockings() {
	await requireRole("Admin");
	return await db.clocking.findMany();
}

export async function getClocking(employeeId: number, entranceTime: Date) {
	await requireRole("Admin");
	return await db.clocking.findUnique({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}

export async function editClocking(input: Clocking) {
	await requireRole("Admin");
	assertMutationPayload("clocking", "update", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.update({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
		data: {
			exitTime,
		},
	});
}

export async function deleteClocking({ employeeId, entranceTime }: { employeeId: number; entranceTime: Date }) {
	await requireRole("Admin");
	return await db.clocking.delete({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}
