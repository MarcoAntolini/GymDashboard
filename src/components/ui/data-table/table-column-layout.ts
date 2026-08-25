import type { CSSProperties } from "react";
import type { Column, ColumnPinningState, RowPinningState } from "@tanstack/react-table";
import { ColumnWidth } from "@/lib/domain/column-class";

/** Colonne strutturali: non riordinabili dall'operatore. */
export const LOCKED_COLUMN_IDS = new Set(["__select", "actions"]);

export const SELECT_COLUMN_ID = "__select";
export const ACTIONS_COLUMN_ID = "actions";

/** Checkbox 16px + padding cella 16px per lato (come `p-4` verticale). */
export const SELECT_COLUMN_SIZE = 48;
export const ACTIONS_COLUMN_SIZE = 56;

/** Padding orizzontale per lato di `TableHead`/`TableCell` (`px-4`). */
export const TABLE_CELL_PAD_X = 16;

/** Pavimento assoluto: sotto questa soglia una colonna non è più leggibile. */
export const MIN_COLUMN_SIZE = 64;

/** Usata solo finché le misure DOM non sono disponibili (primo layout, SSR). */
export const FALLBACK_COLUMN_SIZE = 160;

/** `ColumnWidth.Text`: spazio di lettura di default per il testo libero. */
export const TEXT_COLUMN_SIZE = 200;

/** `ColumnWidth.Text` su descrizioni e dettagli: da passare come `ColumnDef.size`. */
export const LONG_TEXT_COLUMN_SIZE = 280;

/**
 * Larghezza definitiva della colonna. `measuredMinSize` è il pavimento misurato a
 * runtime (header + eventuali `meta.widthSamples`, padding incluso): nessuna
 * categoria può scendere sotto, così header e badge non vengono mai tagliati.
 * Solo `ColumnWidth.Text` aggiunge spazio oltre quel pavimento.
 */
export function resolveColumnSize({
	width,
	measuredMinSize,
	declaredSize,
}: {
	width: ColumnWidth | undefined;
	measuredMinSize: number;
	declaredSize: number | undefined;
}): number {
	if (measuredMinSize <= 0) return declaredSize ?? FALLBACK_COLUMN_SIZE;
	const readingSpace =
		width === ColumnWidth.Text ? (declaredSize ?? TEXT_COLUMN_SIZE) : (declaredSize ?? 0);
	return Math.max(MIN_COLUMN_SIZE, measuredMinSize, readingSpace);
}

/**
 * Ancora `__select` a sinistra. `actions` è host nascosto (menu contestuale), non in layout.
 */
export function normalizeColumnPinning(
	pinning: ColumnPinningState,
	options: { hasSelect: boolean; hasActions: boolean }
): ColumnPinningState {
	const left = (pinning.left ?? []).filter(
		(id) => id !== SELECT_COLUMN_ID && id !== ACTIONS_COLUMN_ID
	);
	const right = (pinning.right ?? []).filter(
		(id) => id !== SELECT_COLUMN_ID && id !== ACTIONS_COLUMN_ID
	);

	return {
		left: options.hasSelect ? [SELECT_COLUMN_ID, ...left] : left,
		right: options.hasActions ? [...right, ACTIONS_COLUMN_ID] : right,
	};
}

/** Colonne fissate dall’operatore (esclude checkbox / actions strutturali). */
export function countUserPinnedColumns(pinning: ColumnPinningState): number {
	const left = (pinning.left ?? []).filter((id) => !LOCKED_COLUMN_IDS.has(id));
	const right = (pinning.right ?? []).filter((id) => !LOCKED_COLUMN_IDS.has(id));
	return left.length + right.length;
}

export function countPinnedRows(pinning: RowPinningState): number {
	return (pinning.top?.length ?? 0) + (pinning.bottom?.length ?? 0);
}

/** Larghezza fissa: nessuna colonna assorbe lo spazio residuo, la tabella si adatta alle colonne. */
export function getColumnWidthStyle(size: number): CSSProperties {
	return {
		width: size,
		minWidth: size,
		maxWidth: size,
	};
}

/**
 * Sposta `columnId` di una posizione nella columnOrder.
 * Se `order` è vuota, parte da `leafColumnIds` (ordine corrente TanStack).
 */
export function moveColumnInOrder(
	order: string[],
	leafColumnIds: string[],
	columnId: string,
	direction: -1 | 1
): string[] {
	if (LOCKED_COLUMN_IDS.has(columnId)) return order.length > 0 ? order : leafColumnIds;

	const current = order.length > 0 ? [...order] : [...leafColumnIds];
	const from = current.indexOf(columnId);
	if (from < 0) return current;

	const to = from + direction;
	if (to < 0 || to >= current.length) return current;

	const targetId = current[to];
	if (LOCKED_COLUMN_IDS.has(targetId)) return current;

	current.splice(from, 1);
	current.splice(to, 0, columnId);
	return current;
}

/** Tiene `actions` sempre ultima. */
export function ensureActionsTrailing(order: string[]): string[] {
	if (!order.includes("actions")) return order;
	return [...order.filter((id) => id !== "actions"), "actions"];
}

/** Colonne leaf nell’ordine di pin (left → center → right), allineato a header/celle. */
export function getPinnedLeafColumnOrder(table: {
	getLeftVisibleLeafColumns: () => { id: string; getSize: () => number }[];
	getCenterVisibleLeafColumns: () => { id: string; getSize: () => number }[];
	getRightVisibleLeafColumns: () => { id: string; getSize: () => number }[];
}) {
	return [
		...table.getLeftVisibleLeafColumns(),
		...table.getCenterVisibleLeafColumns(),
		...table.getRightVisibleLeafColumns(),
	];
}

/** Stili sticky per column pinning (scroll orizzontale nel container overflow). */
export function getColumnPinningStyle<TData, TValue>(
	column: Column<TData, TValue>
): CSSProperties {
	const pinned = column.getIsPinned();
	if (!pinned) {
		return {};
	}

	return {
		position: "sticky",
		left: pinned === "left" ? `${column.getStart("left")}px` : undefined,
		right: pinned === "right" ? `${column.getAfter("right")}px` : undefined,
		zIndex: 2,
	};
}
