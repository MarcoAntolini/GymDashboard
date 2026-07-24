/**
 * Policy for list/detail view columns (ticket 10).
 *
 * Classes:
 * - `nativa` — attribute of the entity’s own relation/table
 * - `join` — label/projection from another table for readability
 * - `derivata` — calculated/aggregated projection (never persisted on the wrong table)
 * - `snapshot` — historical fact fixed at sale/event time on the owning row
 */

export const COLUMN_CLASSES = ["nativa", "join", "derivata", "snapshot"] as const;
export type ColumnClass = (typeof COLUMN_CLASSES)[number];

export const VIEW_ENTITIES = [
	"clienti",
	"acquisti",
	"ingressi",
	"prodotti",
	"abbonamenti",
	"pacchetti_ingressi",
	"listino",
	"dipendenti",
	"account",
	"contratti",
	"timbrature",
	"stipendi",
	"bollette",
	"attrezzatura",
	"interventi",
	"pagamenti",
] as const;

export type ViewEntity = (typeof VIEW_ENTITIES)[number];

export type ViewColumnSpec = {
	/** Stable key used in DTO / ColumnDef id or accessorKey */
	key: string;
	class: ColumnClass;
	/** Human-readable origin (table.column, COUNT, helper name, …) */
	source: string;
	notes?: string;
};

/**
 * Matrix: entity → list/detail columns → class.
 * Covers the main CRUD views; unused DA joins are noted where relevant.
 */
export const VIEW_COLUMN_MATRIX: Record<ViewEntity, readonly ViewColumnSpec[]> = {
	clienti: [
		{ key: "id", class: "nativa", source: "clienti.id" },
		{ key: "taxCode", class: "nativa", source: "clienti.codice_fiscale" },
		{ key: "name", class: "nativa", source: "clienti.nome" },
		{ key: "surname", class: "nativa", source: "clienti.cognome" },
		{ key: "birthDate", class: "nativa", source: "clienti.data_nascita" },
		{ key: "street", class: "nativa", source: "clienti.via" },
		{ key: "houseNumber", class: "nativa", source: "clienti.civico" },
		{ key: "city", class: "nativa", source: "clienti.città" },
		{ key: "province", class: "nativa", source: "clienti.provincia" },
		{ key: "phoneNumber", class: "nativa", source: "clienti.telefono" },
		{ key: "email", class: "nativa", source: "clienti.email" },
		{ key: "enrollmentDate", class: "nativa", source: "clienti.data_iscrizione" },
		// Explicit non-column: residuo is NEVER on Cliente (ticket 03 / domain schema).
	],
	acquisti: [
		{ key: "id", class: "nativa", source: "acquisti.id" },
		{ key: "clientId", class: "nativa", source: "acquisti.id_cliente" },
		{
			key: "client",
			class: "join",
			source: "clienti.nome/cognome",
			notes: "Label via Purchase.client include; not a Client residual",
		},
		{ key: "date", class: "nativa", source: "acquisti.data" },
		{
			key: "amount",
			class: "snapshot",
			source: "acquisti.importo",
			notes: "Sale-time money snapshot; default from Listino year+product",
		},
		{ key: "productCode", class: "nativa", source: "acquisti.codice_prodotto" },
		{
			key: "duration",
			class: "snapshot",
			source: "acquisti.durata",
			notes: "Copied from Abbonamento at sale; immutable thereafter",
		},
		{
			key: "entranceNumber",
			class: "snapshot",
			source: "acquisti.numero_ingressi",
			notes: "Copied from Pacchetto at sale; immutable thereafter",
		},
		{
			key: "remainingEntrances",
			class: "derivata",
			source: "snapshot N − COUNT(ingressi)",
			notes: "DTO-only; never persist on clienti or acquisti",
		},
		{
			key: "prodotto",
			class: "join",
			source: "prodotti + specializzazioni",
			notes: "Included for filters/labels; kind must not be written on Acquisto",
		},
	],
	ingressi: [
		{ key: "id", class: "nativa", source: "ingressi.id" },
		{ key: "date", class: "nativa", source: "ingressi.data" },
		{ key: "purchaseId", class: "nativa", source: "ingressi.id_acquisto" },
		{
			key: "client",
			class: "join",
			source: "acquisti → clienti",
			notes: "Operatore needs Cliente label; Ingresso has no clientId column",
		},
		{
			key: "product",
			class: "join",
			source: "acquisti.codice_prodotto",
		},
		{
			key: "productKind",
			class: "derivata",
			source: "deriveProductKind(prodotto live)",
			notes:
				"Live Product ISA badge for readability. Access rights use Acquisto snapshots (duration/N), not this live kind.",
		},
	],
	prodotti: [
		{ key: "code", class: "nativa", source: "prodotti.codice" },
		{
			key: "productKind",
			class: "derivata",
			source: "membership XOR entranceSet",
			notes: "Optional UI projection; not a prodotti.tipo column",
		},
	],
	abbonamenti: [
		{ key: "productCode", class: "nativa", source: "abbonamenti.codice_prodotto" },
		{ key: "duration", class: "nativa", source: "abbonamenti.durata" },
	],
	pacchetti_ingressi: [
		{ key: "productCode", class: "nativa", source: "pacchetti_ingressi.codice_prodotto" },
		{ key: "entranceNumber", class: "nativa", source: "pacchetti_ingressi.numero_ingressi" },
	],
	listino: [
		{ key: "year", class: "nativa", source: "listino.anno" },
		{ key: "productCode", class: "nativa", source: "listino.codice_prodotto" },
		{ key: "price", class: "nativa", source: "listino.prezzo" },
		{
			key: "productKind",
			class: "derivata",
			source: "deriveProductKind(product)",
			notes: "Never persist tipo on Listino (ticket 04)",
		},
		{
			key: "product",
			class: "join",
			source: "prodotti + specializzazioni",
		},
	],
	dipendenti: [
		{ key: "id", class: "nativa", source: "dipendenti.id" },
		{ key: "taxCode", class: "nativa", source: "dipendenti.codice_fiscale" },
		{ key: "name", class: "nativa", source: "dipendenti.nome" },
		{ key: "surname", class: "nativa", source: "dipendenti.cognome" },
		{ key: "birthDate", class: "nativa", source: "dipendenti.data_nascita" },
		{ key: "street", class: "nativa", source: "dipendenti.via" },
		{ key: "houseNumber", class: "nativa", source: "dipendenti.civico" },
		{ key: "city", class: "nativa", source: "dipendenti.città" },
		{ key: "province", class: "nativa", source: "dipendenti.provincia" },
		{ key: "phoneNumber", class: "nativa", source: "dipendenti.telefono" },
		{ key: "email", class: "nativa", source: "dipendenti.email" },
		{ key: "hiringDate", class: "nativa", source: "dipendenti.data_assunzione" },
	],
	account: [
		{ key: "employeeId", class: "nativa", source: "account.id_dipendente" },
		{ key: "username", class: "nativa", source: "account.username" },
		{
			key: "password",
			class: "nativa",
			source: "account.password",
			notes: "Native column; write-only on create; list UI masked with per-row reveal (ticket 15)",
		},
		{ key: "role", class: "nativa", source: "account.ruolo" },
		{ key: "approved", class: "nativa", source: "account.approvato" },
	],
	contratti: [
		{ key: "employeeId", class: "nativa", source: "contratti.id_dipendente" },
		{ key: "startingDate", class: "nativa", source: "contratti.data_inizio" },
		{ key: "type", class: "nativa", source: "contratti.tipo" },
		{ key: "hourlyFee", class: "nativa", source: "contratti.costo_orario" },
		{ key: "endingDate", class: "nativa", source: "contratti.data_fine" },
		{
			key: "employee",
			class: "join",
			source: "dipendenti.nome/cognome",
			notes: "List label via Contract.employee include (ticket 36)",
		},
	],
	timbrature: [
		{ key: "employeeId", class: "nativa", source: "timbrature.id_dipendente" },
		{ key: "entranceTime", class: "nativa", source: "timbrature.entrata" },
		{ key: "exitTime", class: "nativa", source: "timbrature.uscita" },
	],
	stipendi: [
		{ key: "paymentId", class: "nativa", source: "stipendi.id_pagamento" },
		{ key: "employeeId", class: "nativa", source: "stipendi.id_dipendente" },
		{
			key: "payment",
			class: "join",
			source: "pagamenti.*",
			notes: "DA may include; list UI currently shows FKs only (ticket 36)",
		},
		{
			key: "employee",
			class: "join",
			source: "dipendenti.nome/cognome",
			notes: "DA may include; list UI currently shows FKs only (ticket 36)",
		},
	],
	bollette: [
		{ key: "paymentId", class: "nativa", source: "bollette.id_pagamento" },
		{ key: "description", class: "nativa", source: "bollette.descrizione" },
		{ key: "provider", class: "nativa", source: "bollette.fornitore" },
		{
			key: "payment",
			class: "join",
			source: "pagamenti.*",
			notes: "DA may include; list UI currently shows entity attrs only (ticket 36)",
		},
	],
	attrezzatura: [
		{ key: "paymentId", class: "nativa", source: "attrezzature.id_pagamento" },
		{ key: "description", class: "nativa", source: "attrezzature.descrizione" },
		{ key: "provider", class: "nativa", source: "attrezzature.fornitore" },
		{
			key: "payment",
			class: "join",
			source: "pagamenti.*",
			notes: "DA may include; list UI currently shows entity attrs only (ticket 36)",
		},
	],
	interventi: [
		{ key: "paymentId", class: "nativa", source: "interventi.id_pagamento" },
		{ key: "description", class: "nativa", source: "interventi.descrizione" },
		{ key: "provider", class: "nativa", source: "interventi.fornitore" },
		{
			key: "payment",
			class: "join",
			source: "pagamenti.*",
			notes: "DA may include; list UI currently shows entity attrs only (ticket 36)",
		},
	],
	pagamenti: [
		{ key: "id", class: "nativa", source: "pagamenti.id" },
		{ key: "date", class: "nativa", source: "pagamenti.data" },
		{ key: "amount", class: "nativa", source: "pagamenti.importo" },
	],
} as const;

/** Audit findings that are intentional deferrals (not false persistence). */
export const VIEW_COLUMN_AUDIT_NOTES = [
	"Cliente has no remainingEntrances / ingressi_rimanenti — compliant (ticket 03).",
	"Listino/Acquisto have no tipo column — productKind is derivata only (tickets 04/05).",
	"Acquisto.amount/duration/entranceNumber are snapshots on acquisti — correct table.",
	"remainingEntrances is DTO derivata on PurchaseWithSnapshot only.",
	"Ingressi productKind badge uses live Product ISA (derivata); justification uses Acquisto snapshots.",
	"Account.password is nativa; list UI masks with per-row reveal; mutations stay write-only create (ticket 15).",
	"Stipendi/Bollette/Attrezzatura/Interventi: payment/employee joins in DA not shown in list — ticket 36.",
] as const;

export function viewColumns(entity: ViewEntity): readonly ViewColumnSpec[] {
	return VIEW_COLUMN_MATRIX[entity];
}

export function columnClassFor(
	entity: ViewEntity,
	key: string
): ColumnClass | undefined {
	return VIEW_COLUMN_MATRIX[entity].find((col) => col.key === key)?.class;
}

export function columnsOfClass(
	entity: ViewEntity,
	columnClass: ColumnClass
): readonly ViewColumnSpec[] {
	return VIEW_COLUMN_MATRIX[entity].filter((col) => col.class === columnClass);
}

/** TanStack ColumnDef.meta helper — keeps UI tags aligned with the matrix. */
export function columnMeta(columnClass: ColumnClass): { columnClass: ColumnClass } {
	return { columnClass };
}

/** Keys that must never appear as persisted Cliente attributes. */
export const FORBIDDEN_CLIENT_PERSISTED_KEYS = [
	"remainingEntrances",
	"ingressi_rimanenti",
	"remaining_entrances",
] as const;

export function isForbiddenClientPersistedKey(key: string): boolean {
	return (FORBIDDEN_CLIENT_PERSISTED_KEYS as readonly string[]).includes(key);
}
