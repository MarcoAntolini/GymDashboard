"use server";

import { requireRole, requireSession } from "@/lib/auth";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo";
import { db } from "@/lib/db";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Employee, Prisma } from "@prisma/client";

export type OwnProfileEditableFields = {
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	profilePhotoUrl?: string | null;
};

async function applyProfilePhoto(
	employeeId: number,
	incoming: string | null | undefined,
	current: string | null | undefined
) {
	const next = await resolveProfilePhotoUrl(employeeId, incoming, current);
	if (next === undefined) return {};
	return { profilePhotoUrl: next };
}

const employeeFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.EmployeeWhereInput | undefined>
> = {
	surname: (filter) => {
		const value = textContains(filter);
		return value ? { surname: { contains: value } } : undefined;
	},
	name: (filter) => {
		const value = textContains(filter);
		return value ? { name: { contains: value } } : undefined;
	},
	taxCode: (filter) => {
		const value = textContains(filter);
		return value ? { taxCode: { contains: value } } : undefined;
	},
	city: (filter) => {
		const values = enumValues(filter);
		return values ? { city: { in: values } } : undefined;
	},
	province: (filter) => {
		const values = enumValues(filter);
		return values ? { province: { in: values } } : undefined;
	},
};

const employeeSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.EmployeeOrderByWithRelationInput>
> = {
	surname: (desc) => ({ surname: desc ? "desc" : "asc" }),
	name: (desc) => ({ name: desc ? "desc" : "asc" }),
	taxCode: (desc) => ({ taxCode: desc ? "desc" : "asc" }),
	phoneNumber: (desc) => ({ phoneNumber: desc ? "desc" : "asc" }),
	email: (desc) => ({ email: desc ? "desc" : "asc" }),
	birthDate: (desc) => ({ birthDate: desc ? "desc" : "asc" }),
	city: (desc) => ({ city: desc ? "desc" : "asc" }),
	province: (desc) => ({ province: desc ? "desc" : "asc" }),
	hiringDate: (desc) => ({ hiringDate: desc ? "desc" : "asc" }),
	id: (desc) => ({ id: desc ? "desc" : "asc" }),
};

const EMPLOYEE_FACET_FIELDS = ["city", "province"] as const;

async function loadEmployeeFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const facets: Record<string, FacetOption[]> = {};

	await Promise.all(
		EMPLOYEE_FACET_FIELDS.map(async (field) => {
			const where = buildWhere(filters, employeeFilterMap, { exclude: field });
			const groups =
				field === "city"
					? await db.employee.groupBy({
							by: ["city"],
							where,
							_count: { _all: true },
							orderBy: { city: "asc" },
						})
					: await db.employee.groupBy({
							by: ["province"],
							where,
							_count: { _all: true },
							orderBy: { province: "asc" },
						});
			facets[field] = (
				groups as Array<{ city?: string; province?: string; _count: { _all: number } }>
			).map((group) => ({
				value: String(field === "city" ? group.city : group.province),
				count: group._count._all,
			}));
		})
	);

	return facets;
}

export async function createEmployee({
	taxCode,
	name,
	surname,
	birthDate,
	street,
	houseNumber,
	city,
	province,
	phoneNumber,
	email,
	hiringDate,
	profilePhotoUrl,
}: {
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber?: string;
	email?: string;
	hiringDate?: Date;
	profilePhotoUrl?: string | null;
}) {
	await requireRole("Admin");
	const created = await db.employee.create({
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber: phoneNumber || "",
			email: email || "",
			hiringDate: hiringDate || new Date(),
		},
	});
	if (profilePhotoUrl) {
		const photo = await applyProfilePhoto(created.id, profilePhotoUrl, null);
		if (photo.profilePhotoUrl) {
			return await db.employee.update({
				where: { id: created.id },
				data: photo,
			});
		}
	}
	return created;
}

/** Server-paginated/filtered employee list (ListQuery). */
export async function listEmployees(rawQuery: ListQuery): Promise<ListResult<Employee>> {
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, employeeFilterMap);
	const orderBy = resolveOrderBy(query.sort, employeeSortMap, { surname: "asc" });

	const [total, items, facets] = await Promise.all([
		db.employee.count({ where }),
		db.employee.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
		loadEmployeeFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getEmployee(id: number) {
	return await db.employee.findUnique({
		where: {
			id,
		},
	});
}

export async function editEmployee({
	id,
	taxCode,
	name,
	surname,
	birthDate,
	street,
	houseNumber,
	city,
	province,
	phoneNumber,
	email,
	hiringDate,
	profilePhotoUrl,
}: {
	id: number;
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	hiringDate: Date;
	profilePhotoUrl?: string | null;
}) {
	await requireRole("Admin");
	const current = await db.employee.findUnique({ where: { id } });
	if (!current) {
		throw new Error("Dipendente non trovato.");
	}
	const photo = await applyProfilePhoto(id, profilePhotoUrl, current.profilePhotoUrl);
	return await db.employee.update({
		where: {
			id,
		},
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			hiringDate,
			...photo,
		},
	});
}

/** Linked Dipendente for the authenticated Account. */
export async function getOwnEmployee() {
	const session = await requireSession();
	const account = await db.account.findUnique({
		where: { username: session.u },
		include: { employee: true },
	});
	if (!account?.employee) {
		throw new Error("Nessun Dipendente collegato a questo Account.");
	}
	return account.employee;
}

/**
 * Self-service anagrafica: contact + address + optional photo only.
 * Identity/HR fields remain Admin-only.
 */
export async function editOwnEmployeeProfile(fields: OwnProfileEditableFields) {
	const employee = await getOwnEmployee();
	const photo = await applyProfilePhoto(
		employee.id,
		fields.profilePhotoUrl,
		employee.profilePhotoUrl
	);
	return await db.employee.update({
		where: { id: employee.id },
		data: {
			street: fields.street,
			houseNumber: fields.houseNumber,
			city: fields.city,
			province: fields.province,
			phoneNumber: fields.phoneNumber,
			email: fields.email,
			...photo,
		},
	});
}

export async function deleteEmployee({ id }: { id: number }) {
	await requireRole("Admin");
	const current = await db.employee.findUnique({ where: { id } });
	if (current?.profilePhotoUrl) {
		await resolveProfilePhotoUrl(id, null, current.profilePhotoUrl);
	}
	return await db.employee.delete({
		where: {
			id,
		},
	});
}

export async function getEmployeesWithoutAccount() {
	return await db.employee.findMany({
		where: {
			account: {
				is: null,
			},
		},
	});
}

export async function getEmployeesWithoutContract() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			contracts: {
				none: {},
			},
		},
	});
}
