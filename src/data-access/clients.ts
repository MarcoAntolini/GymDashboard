"use server";

import { requireRole } from "@/lib/auth";
import {
	CLIENT_LIST_DEFAULT_SORT,
	CLIENT_LIST_SORT_COLUMNS,
	buildClientListWhere,
	clientListHasActiveFilters,
} from "@/lib/domain/client-list-query";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	CLIENT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Client, type Prisma } from "@prisma/client";

export type ClientListResult = ListQueryResult<Client> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

export async function createClient(input: Omit<Client, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("clienti", "create", input);
	const {
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
	} = input;
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

/**
 * Server-side Clienti list (ticket 20): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listClients(
	input: ListQueryInput
): Promise<ClientListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildClientListWhere(
				params.filters
			) as Prisma.ClientWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, CLIENT_LIST_DEFAULT_SORT) ??
				prismaOrderBy(CLIENT_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = clientListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.client.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.client.count({ where }),
				needsUnfiltered
					? db.client.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows, total };
		},
		{
			allowedSortColumns: CLIENT_LIST_SORT_COLUMNS,
			defaultSort: CLIENT_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listClients} for the Clienti page list. */
export async function getAllClients() {
	await requireRole("Employee");
	return await db.client.findMany();
}

export async function getClient(id: number) {
	await requireRole("Employee");
	return await db.client.findUnique({
		where: {
			id,
		},
	});
}

export async function editClient(input: Client) {
	await requireRole("Employee");
	assertAllowedMutation("clienti", "update", input);
	const {
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
	} = input;
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
		rethrowRestrictDelete(error, CLIENT_HAS_PURCHASES_MESSAGE);
	}
}
