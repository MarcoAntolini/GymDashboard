"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { throwIfRestrictViolation } from "@/lib/domain/prisma-restrict";
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
	CLIENT_DEFAULT_SORT,
	CLIENT_FILTER_ALLOWLIST,
	CLIENT_SORT_ALLOWLIST,
} from "@/lib/list/clients";
import { Client, Prisma } from "@prisma/client";

const CLIENT_HAS_SALES_MESSAGE =
	"Impossibile eliminare il Cliente: esistono Vendite collegate (vincolo Restrict).";

function buildClientWhere(filters: ListFilters): Prisma.ClientWhereInput {
	const where: Prisma.ClientWhereInput = {};
	for (const key of CLIENT_FILTER_ALLOWLIST) {
		const raw = filters[key];
		if (typeof raw !== "string") continue;
		const value = raw.trim();
		if (!value) continue;
		where[key] = { contains: value };
	}
	return where;
}

/**
 * Lista Clienti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listClients(
	input: ListQueryInput = {}
): Promise<ListResult<Client>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: CLIENT_SORT_ALLOWLIST,
		filterAllowlist: CLIENT_FILTER_ALLOWLIST,
		defaultSort: [...CLIENT_DEFAULT_SORT],
	});
	const where = buildClientWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su id (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "id" in o) ? [] : [{ id: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.client.count({ where }),
		db.client.findMany({ where, skip, take, orderBy: orderByStable }),
	]);
	return buildListResult(items, total, query);
}

export async function createClient(input: Omit<Client, "id">) {
  assertMutationPayload("client", "create", input);
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

export async function getAllClients() {
  return await db.client.findMany();
}

export async function getClient(id: number) {
  return await db.client.findUnique({
    where: {
      id,
    },
  });
}

export async function editClient(input: Client) {
  assertMutationPayload("client", "update", input);
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
	try {
		return await db.client.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		throwIfRestrictViolation(error, CLIENT_HAS_SALES_MESSAGE);
	}
}