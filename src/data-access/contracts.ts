"use server";

import { requireRole } from "@/lib/auth";
import {
	CONTRACT_LIST_DEFAULT_SORT,
	CONTRACT_LIST_SORT_COLUMNS,
	buildContractListOrderBy,
	buildContractListWhere,
	contractListHasActiveFilters,
} from "@/lib/domain/contract-list-query";
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
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
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
	/** Join label for list readability (ticket 36). */
	employee?: {
		id: number;
		name: string;
		surname: string;
	} | null;
};

const contractListInclude = {
	employee: { select: { id: true, name: true, surname: true } },
} as const;

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
	await requireRole("Admin");
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

export type ContractListResult = ListQueryResult<ContractRow> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Contratti list (ticket 29): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listContracts(
	input: ListQueryInput
): Promise<ContractListResult> {
	await requireRole("Admin");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildContractListWhere(
				params.filters
			) as Prisma.ContractWhereInput;
			const orderBy =
				buildContractListOrderBy(params.sort) ??
				buildContractListOrderBy(CONTRACT_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = contractListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.contract.findMany({
					where,
					include: contractListInclude,
					orderBy,
					...skipTake,
				}),
				db.contract.count({ where }),
				needsUnfiltered
					? db.contract.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows: rows.map(withHourlyFeeString),
				total,
			};
		},
		{
			allowedSortColumns: CONTRACT_LIST_SORT_COLUMNS,
			defaultSort: CONTRACT_LIST_DEFAULT_SORT,
		}
	);

	return {
		...result,
		totalUnfiltered,
		emptyKind: listEmptyKind({
			totalUnfiltered,
			total: result.total,
			rowCount: result.rows.length,
		}),
	};
}

/** Full table — prefer {@link listContracts} for the Contratti page list. */
export async function getAllContracts(): Promise<ContractRow[]> {
	await requireRole("Admin");
	const contracts = await db.contract.findMany();
	return contracts.map(withHourlyFeeString);
}

export async function getContract(
	employeeId: number,
	startingDate: Date
): Promise<ContractRow | null> {
	await requireRole("Admin");
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
	await requireRole("Admin");
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
	await requireRole("Admin");
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
	await requireRole("Admin");
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
