import type { ListQuery, ListSort, SortDirection } from "./types";

/** Prisma `skip` / `take` da ListQuery (page 1-based). */
export function toPrismaPage(query: Pick<ListQuery, "page" | "pageSize">): {
	skip: number;
	take: number;
} {
	const take = query.pageSize;
	const skip = (query.page - 1) * take;
	return { skip, take };
}

/** Join Dipendente: cognome, poi nome (stesso ordine di `formatPersonName`). */
export function employeeJoinOrderBy(dir: SortDirection) {
	return [
		{ employee: { surname: dir } },
		{ employee: { name: dir } },
	] as const;
}

/**
 * Costruisce `orderBy` Prisma da sort allowlist-sanitizzato.
 * Ritorna `undefined` se vuoto (lascia default entity).
 */
export function toPrismaOrderBy(
	sort: ListSort[]
): Record<string, SortDirection>[] | undefined {
	if (!sort.length) return undefined;
	return sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }));
}

/**
 * Helper comodo per data-access: page + orderBy in un colpo.
 * `sort` deve già essere passato da `normalizeListQuery`.
 */
export function toPrismaListArgs(query: ListQuery): {
	skip: number;
	take: number;
	orderBy: Record<string, SortDirection>[] | undefined;
} {
	const { skip, take } = toPrismaPage(query);
	return {
		skip,
		take,
		orderBy: toPrismaOrderBy(query.sort),
	};
}
