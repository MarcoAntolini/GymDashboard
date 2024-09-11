"use server";

import { db } from "@/lib/db";
import { Contract, ContractType } from "@prisma/client";

export async function createContract({
	employeeId,
	type,
	hourlyFee,
	startingDate,
	endingDate,
}: {
	employeeId: number;
	type: ContractType;
	hourlyFee: number;
	startingDate: Date;
	endingDate?: Date;
}) {
	return await db.contract.create({
		data: {
			employeeId,
			type,
			hourlyFee,
			startingDate,
			endingDate,
		},
	});
}

export async function getAllContracts() {
	return await db.contract.findMany();
}

export async function getContract(employeeId: number, startingDate: Date) {
	return await db.contract.findUnique({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
}

export async function editContract({
	employeeId,
	startingDate,
	type,
	hourlyFee,
	endingDate,
}: Contract) {
	return await db.contract.update({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
		data: {
			type,
			hourlyFee,
			endingDate,
		},
	});
}

export async function deleteContract({
	employeeId,
	startingDate,
}: {
	employeeId: number;
	startingDate: Date;
}) {
	return await db.contract.delete({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
}
