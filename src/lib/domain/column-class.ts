/**
 * Classificazione colonne viste lista/dettaglio (policy ticket 10).
 * Usare in `ColumnDef.meta.columnClass` e nella matrice `docs/domain/04-viste-colonne.md`.
 */
export const ColumnClass = {
	/** Attributo della relazione dell’entità della vista. */
	Native: "native",
	/** Dato di un’altra tabella mostrato per leggibilità (proiezione/join). */
	Join: "join",
	/** Calcolo o aggregato (es. tipo prodotto, residuo pacchetto). Non persistito sulla tabella sbagliata. */
	Derived: "derived",
	/** Fatto memorizzato alla vendita / evento (es. importo/durata/N su Acquisto). */
	Snapshot: "snapshot",
} as const;

export type ColumnClass = (typeof ColumnClass)[keyof typeof ColumnClass];

export type ViewColumnMeta = {
	columnClass: ColumnClass;
};

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData, TValue> {
		columnClass?: ColumnClass;
	}
}

export function columnMeta(columnClass: ColumnClass): { columnClass: ColumnClass } {
	return { columnClass };
}
