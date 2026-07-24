import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CLIENT_SORT_ALLOWLIST = [
	"id",
	"taxCode",
	"name",
	"surname",
	"birthDate",
	"city",
	"province",
	"enrollmentDate",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CLIENT_FILTER_ALLOWLIST = [
	"taxCode",
	"name",
	"surname",
	"city",
	"province",
] as const;

export const CLIENT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "surname", desc: false },
	{ id: "name", desc: false },
];
