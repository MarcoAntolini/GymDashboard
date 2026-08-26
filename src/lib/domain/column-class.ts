/**
 * Classificazione colonne viste lista/dettaglio (policy ticket 10).
 * Usare in `ColumnDef.meta.columnClass` e nella matrice `docs/domain/04-viste-colonne.md`.
 */

import type { ReactNode } from "react";

export const ColumnClass = {
	/** Attributo della relazione dell’entità della vista. */
	Native: "native",
	/** Dato di un’altra tabella mostrato per leggibilità (proiezione/join). */
	Join: "join",
	/** Calcolo o aggregato (es. tipo prodotto, residuo pacchetto). Non persistito sulla tabella sbagliata. */
	Derived: "derived",
	/** Fatto memorizzato alla vendita / evento (es. importo/durata/N su Vendita). */
	Snapshot: "snapshot",
} as const;

export type ColumnClass = (typeof ColumnClass)[keyof typeof ColumnClass];

/**
 * Categoria di larghezza colonna. Il calcolo vive in
 * `components/ui/data-table/table-column-layout.ts` (`resolveColumnSize`) e parte
 * sempre dalla min-width misurata sull'header.
 */
export const ColumnWidth = {
	/** Contenuto mai più lungo dell'header (importi, etichette corte): resta alla min-width misurata. */
	Fit: "fit",
	/** Larghezza dettata dal contenuto peggiore dichiarato in `widthSamples` (badge, codici a lunghezza fissa). */
	Content: "content",
	/** Testo libero: spazio di lettura extra, troncamento affidato a `OverflowText`. */
	Text: "text",
} as const;

export type ColumnWidth = (typeof ColumnWidth)[keyof typeof ColumnWidth];

export type ViewColumnMeta = {
	columnClass: ColumnClass;
	/** Cella con controlli (es. mostra/nascondi password): niente wrap OverflowText sulla cella intera. */
	noCellOverflow?: boolean;
	/** Due righe (data + ora): niente ellipsis a riga unica, consente wrap dentro h-12. */
	stacked?: boolean;
	/** Categoria di larghezza (default `fit`). */
	width?: ColumnWidth;
	/** Contenuti peggiori che la colonna deve poter mostrare senza tagli (`width: content`). */
	widthSamples?: ReactNode[];
};

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData, TValue> {
		columnClass?: ColumnClass;
		/** Cella con controlli (es. mostra/nascondi password): niente wrap OverflowText sulla cella intera. */
		noCellOverflow?: boolean;
		/** Due righe (data + ora): niente ellipsis a riga unica, consente wrap dentro h-12. */
		stacked?: boolean;
		/** Categoria di larghezza (default `fit`). */
		width?: ColumnWidth;
		/** Contenuti peggiori che la colonna deve poter mostrare senza tagli (`width: content`). */
		widthSamples?: ReactNode[];
	}
}

type CellLayoutMeta = Pick<ViewColumnMeta, "noCellOverflow" | "stacked">;

/** `content` senza campioni non è misurabile: il tipo lo impedisce. */
type WidthMeta =
	| { width?: typeof ColumnWidth.Fit | typeof ColumnWidth.Text }
	| { width: typeof ColumnWidth.Content; widthSamples: ReactNode[] };

export function columnMeta(
	columnClass: ColumnClass,
	extra?: CellLayoutMeta & WidthMeta
): ViewColumnMeta {
	return extra ? { columnClass, ...extra } : { columnClass };
}
