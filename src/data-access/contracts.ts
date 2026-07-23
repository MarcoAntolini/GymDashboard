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
import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { ContractType, Prisma } from "@prisma/client";

type ContractIdentity = {
	employeeId: number;
	startingDate: Date;
};

export type ContractRow = {
	employeeId: number;
	type: ContractType;
	/** Always a 2-decimal string for forms/display (Decimal end-to-end via Prisma write). */
	hourlyFee: string;
	startingDate: Date;
	endingDate: Date | null;
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

function withHourlyFeeString<
	T extends { hourlyFee: string | number | { toFixed: (digits: number) => string } },
>(contract: T): Omit<T, "hourlyFee"> & { hourlyFee: string } {
	return {
		...contract,
		hourlyFee: formatCatalogPrice(contract.hourlyFee),
	};
}

export async function createContract(input: {
	employeeId: number;
	type: ContractType;
	hourlyFee: string | number | Prisma.Decimal;
	startingDate: Date;
	endingDate?: Date | null;
}): Promise<ContractRow> {
	assertAllowedMutation("contratti", "create", input);
	const { employeeId, type, hourlyFee, startingDate, endingDate } = input;
	const normalizedEndingDate = normalizeContractEndingDate(type, endingDate);
	assertContractEndingDate(type, startingDate, normalizedEndingDate);

	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: normalizedEndingDate,
	});

	const feeString = formatCatalogPrice(
		typeof hourlyFee === "string" ? hourlyFee : String(hourlyFee)
	);

	const created = await db.contract.create({
		data: {
			employeeId,
			type,
			hourlyFee: new Prisma.Decimal(feeString),
			startingDate,
			endingDate: normalizedEndingDate,
		},
	});
	return withHourlyFeeString(created);
}

export async function getAllContracts(): Promise<ContractRow[]> {
	const contracts = await db.contract.findMany();
	return contracts.map(withHourlyFeeString);
}

export async function getContract(
	employeeId: number,
	startingDate: Date
): Promise<ContractRow | null> {
	const contract = await db.contract.findUnique({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
	return contract ? withHourlyFeeString(contract) : null;
}

export async function editContract(input: {
	employeeId: number;
	startingDate: Date;
	type: ContractType;
	hourlyFee: string | number | Prisma.Decimal;
	endingDate?: Date | null;
}): Promise<ContractRow> {
	assertAllowedMutation("contratti", "update", input);
	const { employeeId, startingDate, type, hourlyFee, endingDate } = input;
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

	const feeString = formatCatalogPrice(
		typeof hourlyFee === "string" ? hourlyFee : String(hourlyFee)
	);

	const updated = await db.contract.update({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
		data: {
			type,
			hourlyFee: new Prisma.Decimal(feeString),
			endingDate: normalizedEndingDate,
		},
	});
	return withHourlyFeeString(updated);
}

export async function deleteContract({
	employeeId,
	startingDate,
}: {
	employeeId: number;
	startingDate: Date;
}): Promise<ContractRow> {
	const existing = await db.contract.findUniqueOrThrow({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
	await db.contract.delete({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate,
			},
		},
	});
	return withHourlyFeeString(existing);
}

export type EmployeesEarningsInPeriod = {
	employeeId: number;
	startingDate: Date;
	endingDate: Date | null;
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
	const contracts = await db.contract.findMany({
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
	});

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
		const hourlyFee = Number(formatCatalogPrice(contract.hourlyFee));
		return {
			employeeId: contract.employeeId,
			startingDate: contract.startingDate,
			endingDate: contract.endingDate,
			hourlyFee,
			totalEarnings: hourlyFee * totalHours,
		};
	});
}
