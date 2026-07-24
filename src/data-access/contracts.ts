"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import {
	contractIntervalsOverlap,
	OVERLAPPING_CONTRACT_ERROR,
	type ContractInterval
} from "@/lib/contract-intervals";
import { resolveContractEndingDate } from "@/lib/contract-term";
import { db } from "@/lib/db";
import { Contract, ContractType, Prisma } from "@prisma/client";

type MoneyInput = Prisma.Decimal | number | string;

async function assertNoOverlappingContract({
	employeeId,
	startingDate,
	endingDate,
	excludeStartingDate
}: {
	employeeId: number;
	startingDate: Date;
	endingDate: Date | null;
	/** Su update: esclude la riga stessa (PK employeeId + startingDate). */
	excludeStartingDate?: Date;
}) {
	const others = await db.contract.findMany({
		where: {
			employeeId,
			...(excludeStartingDate
				? { startingDate: { not: excludeStartingDate } }
				: {})
		},
		select: { startingDate: true, endingDate: true }
	});

	const proposed: ContractInterval = { startingDate, endingDate };
	for (const other of others) {
		if (contractIntervalsOverlap(proposed, other)) {
			throw new Error(OVERLAPPING_CONTRACT_ERROR);
		}
	}
}

export async function createContract(input: {
	employeeId: number;
	type: ContractType;
	hourlyFee: MoneyInput;
	startingDate: Date;
	endingDate?: Date;
}) {
	assertMutationPayload("contract", "create", input);
	const { employeeId, type, hourlyFee, startingDate, endingDate } = input;
	const resolvedEndingDate = resolveContractEndingDate({
		type,
		startingDate,
		endingDate
	});

	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: resolvedEndingDate
	});

	return await db.contract.create({
		data: {
			employeeId,
			type,
			hourlyFee: new Prisma.Decimal(hourlyFee),
			startingDate,
			endingDate: resolvedEndingDate
		}
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
				startingDate
			}
		}
	});
}

export async function editContract(input: Omit<Contract, "hourlyFee"> & { hourlyFee: MoneyInput }) {
	assertMutationPayload("contract", "update", input);
	const { employeeId, startingDate, type, hourlyFee, endingDate } = input;
	const resolvedEndingDate = resolveContractEndingDate({
		type,
		startingDate,
		endingDate
	});

	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: resolvedEndingDate,
		excludeStartingDate: startingDate
	});

	return await db.contract.update({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		},
		data: {
			type,
			hourlyFee: new Prisma.Decimal(hourlyFee),
			endingDate: resolvedEndingDate
		}
	});
}

export async function deleteContract({ employeeId, startingDate }: { employeeId: number; startingDate: Date }) {
	return await db.contract.delete({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		}
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
	endingDate
}: {
	startingDate: Date;
	endingDate: Date;
}): Promise<EmployeesEarningsInPeriod[]> {
	const clockings = await db.clocking.findMany({
		where: {
			entranceTime: {
				gte: startingDate,
				lte: endingDate
			},
			exitTime: {
				gte: startingDate,
				lte: endingDate
			}
		}
	});
	return (await db.contract
		.findMany({
			where: {
				OR: [
					{
						startingDate: {
							gte: startingDate,
							lte: endingDate
						}
					},
					{
						endingDate: {
							gte: startingDate,
							lte: endingDate
						}
					},
					{
						startingDate: {
							lte: startingDate
						},
						OR: [
							{
								endingDate: {
									gte: endingDate
								}
							},
							{
								endingDate: null
							}
						]
					}
				]
			}
		})
		.then((contracts) => {
			return contracts.map((contract) => {
				let totalHours = 0;
				for (const clocking of clockings) {
					if (clocking.employeeId === contract.employeeId) {
						if (
							clocking.entranceTime >= contract.startingDate &&
							(contract.endingDate === null || clocking.entranceTime <= contract.endingDate)
						) {
							totalHours +=
								((clocking.exitTime != null ? clocking.exitTime.getTime() : Date.now()) -
									clocking.entranceTime.getTime()) /
								1000 /
								3600;
						}
					}
				}
				const hourlyFee = Number(contract.hourlyFee);
				return {
					employeeId: contract.employeeId,
					startingDate: contract.startingDate,
					endingDate: contract.endingDate,
					hourlyFee,
					totalEarnings: hourlyFee * totalHours
				};
			});
		})) as EmployeesEarningsInPeriod[];
}
