"use server";

import {
	CONTRACT_OVERLAP_ERROR,
	contractIntervalsOverlap,
	type ContractInterval,
} from "@/lib/domain/contract-intervals";
import {
	assertContractEndingDate,
	normalizeContractEndingDate,
} from "@/lib/domain/contract-term";
import { db } from "@/lib/db";
import { Contract, ContractType } from "@prisma/client";

type ContractIdentity = {
	employeeId: number;
	startingDate: Date;
};

/**
 * Reject if [startingDate, endingDate) overlaps another Contratto of the same Dipendente.
 * On update, exclude the row identified by (employeeId, startingDate).
 */
async function assertNoOverlappingContract(
	interval: ContractInterval & { employeeId: number },
	exclude?: ContractIdentity
) {
	const others = await db.contract.findMany({
		where: {
			employeeId: interval.employeeId,
			...(exclude ? { NOT: { startingDate: exclude.startingDate } } : {}),
		},
		select: { startingDate: true, endingDate: true },
	});

	const overlaps = others.some((other) =>
		contractIntervalsOverlap(interval, {
			startingDate: other.startingDate,
			endingDate: other.endingDate,
		})
	);

	if (overlaps) {
		throw new Error(CONTRACT_OVERLAP_ERROR);
	}
}

export async function createContract({
	employeeId,
	type,
	hourlyFee,
	startingDate,
	endingDate
}: {
	employeeId: number;
	type: ContractType;
	hourlyFee: number;
	startingDate: Date;
	endingDate?: Date | null;
}) {
	const normalizedEndingDate = normalizeContractEndingDate(type, endingDate);
	assertContractEndingDate(type, startingDate, normalizedEndingDate);

	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: normalizedEndingDate,
	});

	return await db.contract.create({
		data: {
			employeeId,
			type,
			hourlyFee,
			startingDate,
			endingDate: normalizedEndingDate
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

export async function editContract({ employeeId, startingDate, type, hourlyFee, endingDate }: Contract) {
	const normalizedEndingDate = normalizeContractEndingDate(type, endingDate);
	assertContractEndingDate(type, startingDate, normalizedEndingDate);

	await assertNoOverlappingContract(
		{
			employeeId,
			startingDate,
			endingDate: normalizedEndingDate,
		},
		{ employeeId, startingDate }
	);

	return await db.contract.update({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		},
		data: {
			type,
			hourlyFee,
			endingDate: normalizedEndingDate
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
				return {
					employeeId: contract.employeeId,
					startingDate: contract.startingDate,
					endingDate: contract.endingDate,
					hourlyFee: contract.hourlyFee,
					totalEarnings: contract.hourlyFee * totalHours
				};
			});
		})) as EmployeesEarningsInPeriod[];
}
