"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import {
	contractIntervalsOverlap,
	OVERLAPPING_CONTRACT_ERROR,
	type ContractInterval
} from "@/lib/contract-intervals";
import { requireRole } from "@/lib/auth";
import { resolveContractEndingDate } from "@/lib/contract-term";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
} from "@/lib/list";
import {
	CONTRACT_DEFAULT_SORT,
	CONTRACT_FILTER_ALLOWLIST,
	CONTRACT_SORT_ALLOWLIST,
} from "@/lib/list/contracts";
import { Contract, ContractType, Prisma } from "@prisma/client";

const contractInclude = { employee: true } as const;

export type ContractRow = Prisma.ContractGetPayload<{
	include: typeof contractInclude;
}>;

type MoneyInput = Prisma.Decimal | number | string;

const CONTRACT_TYPES = new Set<string>(Object.values(ContractType));

function parsePositiveIntFilter(raw: ListFilters[string]): number | undefined {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const n = Math.trunc(raw);
		return n > 0 ? n : undefined;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!/^\d+$/.test(trimmed)) return undefined;
		const n = Number.parseInt(trimmed, 10);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	}
	return undefined;
}

function parseContractTypeFilter(raw: ListFilters[string]): ContractType | undefined {
	if (typeof raw !== "string") return undefined;
	const value = raw.trim();
	if (!value || !CONTRACT_TYPES.has(value)) return undefined;
	return value as ContractType;
}

function buildContractWhere(filters: ListFilters): Prisma.ContractWhereInput {
	const where: Prisma.ContractWhereInput = {};

	const employeeId = parsePositiveIntFilter(filters.employeeId);
	if (employeeId !== undefined) where.employeeId = employeeId;

	const type = parseContractTypeFilter(filters.type);
	if (type !== undefined) where.type = type;

	const employee = filters.employee;
	if (typeof employee === "string") {
		const value = employee.trim();
		if (value) {
			where.employee = {
				OR: [
					{ surname: { contains: value } },
					{ name: { contains: value } },
				],
			};
		}
	}

	return where;
}

/**
 * Lista Contratti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listContracts(
	input: ListQueryInput = {}
): Promise<ListResult<ContractRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: CONTRACT_SORT_ALLOWLIST,
		filterAllowlist: CONTRACT_FILTER_ALLOWLIST,
		defaultSort: [...CONTRACT_DEFAULT_SORT],
	});
	const where = buildContractWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK composta (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "employeeId" in o)
			? []
			: [{ employeeId: "asc" as const }]),
		...(orderBy?.some((o) => "startingDate" in o)
			? []
			: [{ startingDate: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.contract.count({ where }),
		db.contract.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: contractInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

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
	await requireRole("Admin");
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
	await requireRole("Admin");
	return await db.contract.findMany();
}

export async function getContract(employeeId: number, startingDate: Date) {
	await requireRole("Admin");
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
	await requireRole("Admin");
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
		},
		include: contractInclude,
	});
}

export async function deleteContract({ employeeId, startingDate }: { employeeId: number; startingDate: Date }) {
	await requireRole("Admin");
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
	await requireRole("Admin");
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
