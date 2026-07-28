import type { CSSProperties } from "react";
import type { Column } from "@tanstack/react-table";

/** Colonne strutturali: non riordinabili dall'operatore. */
export const LOCKED_COLUMN_IDS = new Set(["__select", "__spacer", "actions"]);

export const ACTIONS_COLUMN_SIZE = 56;

export function isFlexSpacerColumn(columnId: string): boolean {
	return columnId === "__spacer";
}

/** Stili larghezza: spacer assorbe lo spazio libero; le altre restano a px fissi. */
export function getColumnWidthStyle(columnId: string, size: number): CSSProperties {
	if (isFlexSpacerColumn(columnId)) {
		// In table-fixed, width 100% on the flex col claims leftover space.
		return { width: "100%" };
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

/** Tiene `__spacer` + `actions` in coda (actions sempre ultima). */
export function ensureActionsTrailing(order: string[]): string[] {
	const rest = order.filter((id) => id !== "__spacer" && id !== "actions");
	const hasSpacer = order.includes("__spacer");
	const hasActions = order.includes("actions");
	return [
		...rest,
		...(hasSpacer ? ["__spacer"] : []),
		...(hasActions ? ["actions"] : []),
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
