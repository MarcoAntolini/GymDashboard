"use server";

import { requireRole } from "@/lib/auth";
import { contractIntervalsOverlap } from "@/lib/contract-intervals";
import { db } from "@/lib/db";
import { normalizeContractEndingDate } from "@/lib/contract-dates";
import { contractTypeLabel, personLabel } from "@/lib/format";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult
} from "@/lib/list-query";
import { ContractType, Prisma } from "@prisma/client";

type MoneyAmount = Prisma.Decimal | string | number;

const contractInclude = {
	employee: true
} as const;

const labelToContractType = Object.fromEntries(
	(Object.keys(contractTypeLabel) as ContractType[]).map((type) => [
		contractTypeLabel[type],
		type
	])
) as Record<string, ContractType>;

type ContractWithRelations = Prisma.ContractGetPayload<{ include: typeof contractInclude }>;

export type ContractDTO = Omit<ContractWithRelations, "hourlyFee"> & { hourlyFee: number };

function toDecimal(amount: MoneyAmount): Prisma.Decimal {
	return amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
}

function serializeContract(contract: ContractWithRelations): ContractDTO {
	return {
		...contract,
		hourlyFee: Number(contract.hourlyFee)
	};
}

const OVERLAP_ERROR =
	"Questo Contratto si sovrappone a un altro dello stesso Dipendente. I periodi devono essere disgiunti ([inizio, fine); senza data di fine il Contratto è in corso).";

async function assertNoOverlappingContract({
	employeeId,
	startingDate,
	endingDate,
	excludeStartingDate
}: {
	employeeId: number;
	startingDate: Date;
	endingDate?: Date | null;
	excludeStartingDate?: Date;
}) {
	const existing = await db.contract.findMany({
		where: {
			employeeId,
			...(excludeStartingDate
				? {
						NOT: {
							startingDate: excludeStartingDate
						}
					}
				: {})
		},
		select: {
			startingDate: true,
			endingDate: true
		}
	});

	const candidate = {
		startingDate,
		endingDate: endingDate ?? null
	};

	const overlaps = existing.some((other) =>
		contractIntervalsOverlap(candidate, {
			startingDate: other.startingDate,
			endingDate: other.endingDate
		})
	);

	if (overlaps) {
		throw new Error(OVERLAP_ERROR);
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
	hourlyFee: MoneyAmount;
	startingDate: Date;
	endingDate?: Date;
}) {
	const normalizedEndingDate = normalizeContractEndingDate(type, endingDate);
	await requireRole("Admin");
	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: normalizedEndingDate
	});

	const contract = await db.contract.create({
		data: {
			employeeId,
			type,
			hourlyFee: toDecimal(hourlyFee),
			startingDate,
			endingDate: normalizedEndingDate
		},
		include: contractInclude
	});
	return serializeContract(contract);
}

/**
 * `employee` search = OR on Dipendente name/surname (and numeric id if the query is an int).
 * Documented mapping: UI column `employee` → Prisma `employee` relation filters.
 */
function employeeNameWhere(value: string): Prisma.ContractWhereInput {
	const or: Prisma.ContractWhereInput[] = [
		{ employee: { is: { surname: { contains: value } } } },
		{ employee: { is: { name: { contains: value } } } }
	];
	const asId = Number(value.replace(/^#/, "").trim());
	if (Number.isInteger(asId) && asId > 0) {
		or.push({ employeeId: asId });
	}
	return { OR: or };
}

function resolveContractTypes(values: string[]): ContractType[] {
	const types: ContractType[] = [];
	for (const value of values) {
		if ((Object.values(ContractType) as string[]).includes(value)) {
			types.push(value as ContractType);
			continue;
		}
		const mapped = labelToContractType[value];
		if (mapped) types.push(mapped);
	}
	return types;
}

const contractFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.ContractWhereInput | undefined>
> = {
	employee: (filter) => {
		const value = textContains(filter);
		return value ? employeeNameWhere(value) : undefined;
	},
	typeLabel: (filter) => {
		const values = enumValues(filter);
		if (!values) return undefined;
		const types = resolveContractTypes(values);
		return types.length > 0 ? { type: { in: types } } : undefined;
	},
	type: (filter) => {
		const values = enumValues(filter);
		if (!values) return undefined;
		const types = resolveContractTypes(values);
		return types.length > 0 ? { type: { in: types } } : undefined;
	}
};

const contractSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.ContractOrderByWithRelationInput>
> = {
	employee: (desc) => ({ employee: { surname: desc ? "desc" : "asc" } }),
	typeLabel: (desc) => ({ type: desc ? "desc" : "asc" }),
	type: (desc) => ({ type: desc ? "desc" : "asc" }),
	hourlyFee: (desc) => ({ hourlyFee: desc ? "desc" : "asc" }),
	startingDate: (desc) => ({ startingDate: desc ? "desc" : "asc" }),
	endingDate: (desc) => ({ endingDate: desc ? "desc" : "asc" }),
	employeeId: (desc) => ({ employeeId: desc ? "desc" : "asc" })
};

async function loadContractFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const where = buildWhere(filters, contractFilterMap, { exclude: "typeLabel" });
	const groups = await db.contract.groupBy({
		by: ["type"],
		where,
		_count: { _all: true },
		orderBy: { type: "asc" }
	});

	return {
		typeLabel: groups.map((group) => ({
			value: contractTypeLabel[group.type],
			count: group._count._all
		}))
	};
}

/** Server-paginated/filtered contract list (employee join + type enum). Admin-only. */
export async function listContracts(rawQuery: ListQuery): Promise<ListResult<ContractDTO>> {
	await requireRole("Admin");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, contractFilterMap);
	const orderBy = resolveOrderBy(query.sort, contractSortMap, { startingDate: "desc" });

	const [total, items, facets] = await Promise.all([
		db.contract.count({ where }),
		db.contract.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: contractInclude
		}),
		loadContractFacets(query.filters)
	]);

	return {
		items: items.map(serializeContract),
		total,
		facets
	};
}

export async function getContract(
	employeeId: number,
	startingDate: Date
): Promise<ContractDTO | null> {
	await requireRole("Admin");
	const contract = await db.contract.findUnique({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		},
		include: contractInclude
	});
	return contract ? serializeContract(contract) : null;
}

export async function editContract({
	employeeId,
	startingDate,
	type,
	hourlyFee,
	endingDate
}: ContractDTO) {
	const normalizedEndingDate = normalizeContractEndingDate(type, endingDate);
	await requireRole("Admin");
	await assertNoOverlappingContract({
		employeeId,
		startingDate,
		endingDate: normalizedEndingDate,
		excludeStartingDate: startingDate
	});

	const contract = await db.contract.update({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		},
		data: {
			type,
			hourlyFee: toDecimal(hourlyFee),
			endingDate: normalizedEndingDate
		},
		include: contractInclude
	});
	return serializeContract(contract);
}

export async function deleteContract({
	employeeId,
	startingDate
}: {
	employeeId: number;
	startingDate: Date;
}): Promise<ContractDTO> {
	await requireRole("Admin");
	const contract = await db.contract.delete({
		where: {
			employeeId_startingDate: {
				employeeId,
				startingDate
			}
		},
		include: contractInclude
	});
	return serializeContract(contract);
}

export type EmployeesEarningsInPeriod = {
	employeeId: number;
	employeeName: string;
	employeeSurname: string;
	employeeLabel: string;
	type: ContractType;
	typeLabel: string;
	startingDate: Date;
	endingDate: Date | null;
	hourlyFee: number;
	totalHours: number;
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
				select: { id: true, name: true, surname: true }
			}
		},
		orderBy: [{ employee: { surname: "asc" } }, { startingDate: "asc" }]
	});

	return contracts.map((contract) => {
		let totalHours = 0;
		for (const clocking of clockings) {
			if (clocking.employeeId !== contract.employeeId) continue;
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
		const hourlyFee = Number(contract.hourlyFee);
		const employee = contract.employee;
		return {
			employeeId: contract.employeeId,
			employeeName: employee.name,
			employeeSurname: employee.surname,
			employeeLabel: personLabel(employee),
			type: contract.type,
			typeLabel: contractTypeLabel[contract.type],
			startingDate: contract.startingDate,
			endingDate: contract.endingDate,
			hourlyFee,
			totalHours,
			totalEarnings: hourlyFee * totalHours
		};
	});
}
