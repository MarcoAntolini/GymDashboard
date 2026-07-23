/**
 * Shared helpers for server-side entity lists (ticket 19).
 *
 * Data-access modules (tickets 20–35) should:
 * 1. Accept {@link ListQueryParams} (or {@link ListQueryInput} + normalize)
 * 2. Build Prisma `where` from `params.filters`
 * 3. Use {@link prismaOrderBy} / `params.skip`+`params.take` for ORDER BY + LIMIT/OFFSET
 * 4. `count` + `findMany` in parallel, then {@link buildListResult}
 *
 * Do not call these helpers on every keystroke — only on Conferma/Filtra,
 * sort change, or page change (see `useServerListQuery`).
 */

import {
	buildListResult,
	normalizeListQuery,
	prismaOrderBy,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryParams,
	type ListQueryResult,
	type NormalizeListQueryOptions,
} from "@/lib/domain/list-query";

export {
	buildListResult,
	normalizeListQuery,
	prismaOrderBy,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryParams,
	type ListQueryResult,
	type NormalizeListQueryOptions,
};

export type ListQueryRunner<T> = (params: ListQueryParams) => Promise<{
	rows: T[];
	total: number;
}>;

/**
 * Normalize input then run a list query, returning a {@link ListQueryResult}.
 * Keeps pagination math and response shape consistent across entities.
 */
export async function runListQuery<T>(
	input: ListQueryInput,
	runner: ListQueryRunner<T>,
	options?: NormalizeListQueryOptions
): Promise<ListQueryResult<T>> {
	const params = normalizeListQuery(input, options);
	const { rows, total } = await runner(params);
	return buildListResult(rows, total, params);
}
