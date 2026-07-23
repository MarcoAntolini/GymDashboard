import { z } from "zod";

/** Text filter — maps to Prisma `contains`. */
export type TextFilter = { kind: "text"; value: string };

/** Faceted string filter — maps to Prisma `in` / `equals`. */
export type EnumFilter = { kind: "enum"; values: string[] };

/** Faceted numeric filter — maps to Prisma `in` on Int columns. */
export type NumberFilter = { kind: "number"; values: number[] };

export type ColumnFilter = TextFilter | EnumFilter | NumberFilter;

export type ColumnFilters = Record<string, ColumnFilter>;

export type ListSort = { id: string; desc: boolean };

export type ListQuery = {
	/** 0-based, aligned with TanStack `pageIndex`. */
	page: number;
	pageSize: number;
	sort?: ListSort;
	filters: ColumnFilters;
};

export type FacetOption = { value: string; count: number };

export type ListResult<T> = {
	items: T[];
	total: number;
	facets?: Record<string, FacetOption[]>;
};

const textFilterSchema = z.object({
	kind: z.literal("text"),
	value: z.string().max(200),
});

const enumFilterSchema = z.object({
	kind: z.literal("enum"),
	values: z.array(z.string().max(200)).max(100),
});

const numberFilterSchema = z.object({
	kind: z.literal("number"),
	values: z.array(z.number()).max(100),
});

export const columnFilterSchema = z.discriminatedUnion("kind", [
	textFilterSchema,
	enumFilterSchema,
	numberFilterSchema,
]);

export const listQuerySchema = z.object({
	page: z.number().int().min(0).default(0),
	pageSize: z.number().int().min(1).max(100).default(10),
	sort: z
		.object({
			id: z.string().max(64),
			desc: z.boolean(),
		})
		.optional(),
	filters: z.record(z.string().max(64), columnFilterSchema).default({}),
});

export const DEFAULT_LIST_QUERY: ListQuery = {
	page: 0,
	pageSize: 10,
	filters: {},
};

export function parseListQuery(input: unknown): ListQuery {
	return listQuerySchema.parse(input);
}

export function hasActiveFilters(filters: ColumnFilters): boolean {
	return Object.values(filters).some((filter) => {
		if (filter.kind === "text") return filter.value.trim().length > 0;
		return filter.values.length > 0;
	});
}

/** Drop empty filters so Prisma `where` stays lean. */
export function compactFilters(filters: ColumnFilters): ColumnFilters {
	const next: ColumnFilters = {};
	for (const [key, filter] of Object.entries(filters)) {
		if (filter.kind === "text") {
			const value = filter.value.trim();
			if (value) next[key] = { kind: "text", value };
			continue;
		}
		if (filter.values.length > 0) {
			next[key] = filter;
		}
	}
	return next;
}

type WhereClause = Record<string, unknown>;

/**
 * Build a Prisma `where` from UI column filters via a per-entity map.
 * Multiple filters combine with `AND`. Pass `exclude` to omit one column
 * (facet option queries scoped to the other active filters).
 */
export function buildWhere<TWhere extends WhereClause>(
	filters: ColumnFilters,
	map: Partial<Record<string, (filter: ColumnFilter) => TWhere | undefined>>,
	options?: { exclude?: string }
): TWhere | undefined {
	const clauses: TWhere[] = [];
	for (const [key, filter] of Object.entries(compactFilters(filters))) {
		if (options?.exclude === key) continue;
		const mapped = map[key]?.(filter);
		if (mapped) clauses.push(mapped);
	}
	if (clauses.length === 0) return undefined;
	if (clauses.length === 1) return clauses[0];
	return { AND: clauses } as unknown as TWhere;
}

export function resolveOrderBy<TOrderBy>(
	sort: ListSort | undefined,
	map: Partial<Record<string, (desc: boolean) => TOrderBy>>,
	fallback?: TOrderBy
): TOrderBy | undefined {
	if (!sort) return fallback;
	const mapped = map[sort.id]?.(sort.desc);
	return mapped ?? fallback;
}

export function textContains(filter: ColumnFilter): string | undefined {
	if (filter.kind !== "text") return undefined;
	const value = filter.value.trim();
	return value || undefined;
}

export function enumValues(filter: ColumnFilter): string[] | undefined {
	if (filter.kind !== "enum") return undefined;
	return filter.values.length > 0 ? filter.values : undefined;
}

export function numberValues(filter: ColumnFilter): number[] | undefined {
	if (filter.kind !== "number") return undefined;
	return filter.values.length > 0 ? filter.values : undefined;
}
