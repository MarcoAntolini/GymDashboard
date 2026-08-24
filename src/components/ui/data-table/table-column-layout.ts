import type { CSSProperties } from "react";
import type { Column, ColumnPinningState } from "@tanstack/react-table";

/** Colonne strutturali: non riordinabili dall'operatore. */
export const LOCKED_COLUMN_IDS = new Set(["__select", "actions"]);

export const SELECT_COLUMN_ID = "__select";
export const ACTIONS_COLUMN_ID = "actions";

/** Checkbox 16px + padding cella 16px per lato (come `p-4` verticale). */
export const SELECT_COLUMN_SIZE = 48;
export const ACTIONS_COLUMN_SIZE = 56;

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

/** Colonna che assorbe lo spazio libero a destra (prima di `actions`, o ultima se manca). */
export function getFlexFillColumnId(leafColumnIds: string[]): string | null {
	const actionsIndex = leafColumnIds.indexOf(ACTIONS_COLUMN_ID);
	if (actionsIndex > 0) {
		const candidate = leafColumnIds[actionsIndex - 1];
		if (candidate !== SELECT_COLUMN_ID) return candidate;
	}

	// Senza actions: ultima colonna dati assorbe lo spazio (evita redistribuzione table-fixed).
	for (let i = leafColumnIds.length - 1; i >= 0; i--) {
		const id = leafColumnIds[i];
		if (id !== SELECT_COLUMN_ID && id !== ACTIONS_COLUMN_ID) return id;
	}
	return null;
}

/** Stili larghezza: la flex-fill cresce; le altre restano a px fissi. */
export function getColumnWidthStyle(
	columnId: string,
	size: number,
	flexFillColumnId: string | null
): CSSProperties {
	if (flexFillColumnId && columnId === flexFillColumnId) {
		// In table-fixed, width 100% claims leftover space after fixed columns.
		return { width: "100%", minWidth: size };
	}
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
