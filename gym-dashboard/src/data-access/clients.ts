"use server";

import { requireRole } from "@/lib/auth";
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
import { Client, Prisma } from "@prisma/client";

const clientFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.ClientWhereInput | undefined>
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

const clientSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.ClientOrderByWithRelationInput>
> = {
	surname: (desc) => ({ surname: desc ? "desc" : "asc" }),
	name: (desc) => ({ name: desc ? "desc" : "asc" }),
	taxCode: (desc) => ({ taxCode: desc ? "desc" : "asc" }),
	phoneNumber: (desc) => ({ phoneNumber: desc ? "desc" : "asc" }),
	email: (desc) => ({ email: desc ? "desc" : "asc" }),
	birthDate: (desc) => ({ birthDate: desc ? "desc" : "asc" }),
	city: (desc) => ({ city: desc ? "desc" : "asc" }),
	province: (desc) => ({ province: desc ? "desc" : "asc" }),
	enrollmentDate: (desc) => ({ enrollmentDate: desc ? "desc" : "asc" }),
	id: (desc) => ({ id: desc ? "desc" : "asc" }),
};

const CLIENT_FACET_FIELDS = ["city", "province"] as const;

async function loadClientFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const facets: Record<string, FacetOption[]> = {};

	await Promise.all(
		CLIENT_FACET_FIELDS.map(async (field) => {
			const where = buildWhere(filters, clientFilterMap, { exclude: field });
			const groups = await db.client.groupBy({
				by: [field],
				where,
				_count: { _all: true },
				orderBy: { [field]: "asc" },
			});
			facets[field] = groups.map((group) => ({
				value: String(group[field]),
				count: group._count._all,
			}));
		})
	);

	return facets;
}

export async function createClient({
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
	enrollmentDate,
}: Omit<Client, "id">) {
	await requireRole("Employee");
	return await db.client.create({
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
			enrollmentDate,
		},
	});
}

/** Full client list for form selects (e.g. entrances), not the clients list page. */
export async function getAllClients() {
	await requireRole("Employee");
	return await db.client.findMany();
}

/** Server-paginated/filtered client list (pilota ListQuery). */
export async function listClients(rawQuery: ListQuery): Promise<ListResult<Client>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, clientFilterMap);
	const orderBy = resolveOrderBy(query.sort, clientSortMap, { surname: "asc" });

	const [total, items, facets] = await Promise.all([
		db.client.count({ where }),
		db.client.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
		loadClientFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getClient(id: number) {
	await requireRole("Employee");
	return await db.client.findUnique({
		where: {
			id,
		},
	});
}

export async function editClient({
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
	enrollmentDate,
}: Client) {
	await requireRole("Employee");
	return await db.client.update({
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
			enrollmentDate,
		},
	});
}

export async function deleteClient({ id }: { id: number }) {
	await requireRole("Employee");
	try {
		return await db.client.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			(error.code === "P2003" || error.code === "P2014")
		) {
			throw new Error(
				"Impossibile eliminare questo Cliente: ha Acquisti collegati. Elimina prima gli Acquisti."
			);
		}
		throw error;
	}
}
