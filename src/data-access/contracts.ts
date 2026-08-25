"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import {
	contractIntervalsOverlap,
	OVERLAPPING_CONTRACT_ERROR,
	type ContractInterval
} from "@/lib/contract-intervals";
import { requireRole } from "@/lib/auth";
import { toClient, type ClientOf } from "@/lib/client-payload";
import { resolveContractEndingDate } from "@/lib/contract-term";
import { db } from "@/lib/db";
import {
	buildListResult,
	employeeJoinOrderBy,
	normalizeListQuery,
	toPrismaPage,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import {
	CONTRACT_DEFAULT_SORT,
	CONTRACT_FILTER_ALLOWLIST,
	CONTRACT_SORT_ALLOWLIST,
} from "@/lib/list/contracts";
import { Contract, ContractType, Prisma } from "@prisma/client";

const contractInclude = { employee: true } as const;

export type ContractRow = ClientOf<
	Prisma.ContractGetPayload<{
		include: typeof contractInclude;
	}>
>;

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

function parseContractTypeFilter(
	raw: ListFilters[string]
): ContractType | ContractType[] | undefined {
	const collect = (entry: unknown): ContractType | undefined => {
		if (typeof entry !== "string") return undefined;
		const value = entry.trim();
		if (!value || !CONTRACT_TYPES.has(value)) return undefined;
		return value as ContractType;
	};

	if (Array.isArray(raw)) {
		const types = [
			...new Set(
				raw.map(collect).filter((type): type is ContractType => type !== undefined)
			),
		];
		if (types.length === 0) return undefined;
		return types.length === 1 ? types[0]! : types;
	}

	return collect(raw);
}

function buildContractWhere(filters: ListFilters): Prisma.ContractWhereInput {
	const where: Prisma.ContractWhereInput = {};

	const employeeId = parsePositiveIntFilter(filters.employeeId);
	if (employeeId !== undefined) where.employeeId = employeeId;

	const type = parseContractTypeFilter(filters.type);
	if (type !== undefined) {
		where.type = Array.isArray(type) ? { in: type } : type;
	}

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

function buildContractOrderBy(
	sort: ListSort[]
): Prisma.ContractOrderByWithRelationInput[] {
	const orderBy: Prisma.ContractOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "employee":
				orderBy.push(...employeeJoinOrderBy(dir));
				break;
			case "hourlyFee":
				orderBy.push({ hourlyFee: dir });
				break;
			case "startingDate":
				orderBy.push({ startingDate: dir });
				break;
			case "endingDate":
				orderBy.push({ endingDate: dir });
				break;
			default:
				break;
		}
	}
	if (!orderBy.some((o) => "employeeId" in o)) {
		orderBy.push({ employeeId: "asc" });
	}
	if (!orderBy.some((o) => "startingDate" in o)) {
		orderBy.push({ startingDate: "asc" });
	}
	return orderBy;
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
	const { skip, take } = toPrismaPage(query);
	const orderByStable = buildContractOrderBy(query.sort);
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

	return toClient(
		await db.contract.create({
			data: {
				employeeId,
				type,
				hourlyFee: new Prisma.Decimal(hourlyFee),
				startingDate,
				endingDate: resolvedEndingDate,
			},
		})
	);
}

export async function getAllContracts() {
	await requireRole("Admin");
	return toClient(await db.contract.findMany());
}

export async function getContract(employeeId: number, startingDate: Date) {
	await requireRole("Admin");
	return toClient(
		await db.contract.findUnique({
			where: {
				employeeId_startingDate: {
					employeeId,
					startingDate,
				},
			},
		})
	);
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

	return toClient(
		await db.contract.update({
			where: {
				employeeId_startingDate: {
					employeeId,
					startingDate,
				},
			},
			data: {
				type,
				hourlyFee: new Prisma.Decimal(hourlyFee),
				endingDate: resolvedEndingDate,
			},
			include: contractInclude,
		})
	);
}

export async function deleteContract({ employeeId, startingDate }: { employeeId: number; startingDate: Date }) {
	await requireRole("Admin");
	return toClient(
		await db.contract.delete({
			where: {
				employeeId_startingDate: {
					employeeId,
					startingDate,
				},
			},
		})
	);
}

/** Anagrafica Dipendente utile in “Calcola guadagni” (non solo ID opaco). */
export type EarningsEmployee = Pick<
	Prisma.EmployeeGetPayload<object>,
	"id" | "name" | "surname" | "taxCode"
>;

export type EmployeesEarningsInPeriod = {
	employeeId: number;
	employee: EarningsEmployee;
	startingDate: Date;
	endingDate: Date | null;
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
	const contracts = await db.contract.findMany({
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
		},
		include: {
			employee: {
				select: { id: true, name: true, surname: true, taxCode: true }
			}
		}
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
		const hourlyFee = Number(contract.hourlyFee);
		return {
			employeeId: contract.employeeId,
			employee: contract.employee,
			startingDate: contract.startingDate,
			endingDate: contract.endingDate,
			hourlyFee,
			totalEarnings: hourlyFee * totalHours
		};
	});
}
