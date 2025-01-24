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

export async function editContract({ employeeId, startingDate, type, hourlyFee, endingDate }: Contract) {
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

export async function deleteContract({ employeeId, startingDate }: { employeeId: number; startingDate: Date }) {
	return await db.contract.delete({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
}

export type EmployeesEarningsInPeriod = {
	employeeId: number;
	startingDate: Date;
	endingDate: Date;
	hourlyFee: number;
	totalEarnings: number;
};

export async function getEmployeesEarningsInPeriod({
	startingDate,
	endingDate,
}: {
	startingDate: Date;
	endingDate: Date;
}): Promise<EmployeesEarningsInPeriod[]> {
	const clockings = await db.clocking.findMany({
		where: {
			entranceTime: {
				gte: startingDate,
				lte: endingDate,
			},
			exitTime: {
				gte: startingDate,
				lte: endingDate,
			},
		},
	});
	return await db.contract
		.findMany({
			where: {
				OR: [
					{
						startingDate: {
							gte: startingDate,
							lte: endingDate,
						},
					},
					{
						endingDate: {
							gte: startingDate,
							lte: endingDate,
						},
					},
					{
						startingDate: {
							lte: startingDate,
						},
						OR: [
							{
								endingDate: {
									gte: endingDate,
								},
							},
							{
								endingDate: null,
							},
						],
					},
				],
			},
		})
		.then((contracts) => {
			return contracts.map((contract) => {
				let totalHours = 0;
				for (const clocking of clockings) {
					if (clocking.employeeId === contract.employeeId) {
						totalHours +=
							((clocking.exitTime != null ? clocking.exitTime.getTime() : Date.now()) -
								clocking.entranceTime.getTime()) /
							1000 /
							3600;
					}
				}
				return {
					employeeId: contract.employeeId,
					startingDate: contract.startingDate,
					endingDate: contract.endingDate,
					hourlyFee: contract.hourlyFee,
					totalEarnings: contract.hourlyFee * totalHours,
				};
			});
		}) as EmployeesEarningsInPeriod[];
}
