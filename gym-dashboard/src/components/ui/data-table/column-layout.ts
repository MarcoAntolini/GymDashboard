import type { CSSProperties } from "react";
import type {
	Column,
	ColumnOrderState,
	ColumnPinningState,
	ColumnSizingState,
	Table,
} from "@tanstack/react-table";

/**
 * Column layout defaults (ticket 18)
 *
 * - Order: column definition order until the operator reorders.
 * - Sizing: TanStack defaults (size 160 / min 80 / max 640) until resized.
 * - Pinning: `actions` pinned right when that column exists; otherwise none.
 * - Persistence: `sessionStorage` when DataTable gets `columnLayoutKey` or
 *   `entityLabel`. Cleared when the browser tab session ends. No key →
 *   in-memory only for the mounted table instance.
 */

export const COLUMN_LAYOUT_STORAGE_PREFIX = "gym-dt-cols:v1:";

export const DEFAULT_COLUMN_SIZE = {
	size: 160,
	minSize: 80,
	maxSize: 640,
} as const;

export type PersistedColumnLayout = {
	order: ColumnOrderState;
	sizing: ColumnSizingState;
	pinning: ColumnPinningState;
};

export function defaultColumnPinning(columnIds: string[]): ColumnPinningState {
	return columnIds.includes("actions") ? { right: ["actions"] } : {};
}

export function columnLayoutStorageKey(layoutKey: string): string {
	return `${COLUMN_LAYOUT_STORAGE_PREFIX}${layoutKey}`;
}

export function loadColumnLayout(layoutKey: string): PersistedColumnLayout | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.sessionStorage.getItem(columnLayoutStorageKey(layoutKey));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<PersistedColumnLayout>;
		return {
			order: Array.isArray(parsed.order) ? parsed.order.map(String) : [],
			sizing:
				parsed.sizing && typeof parsed.sizing === "object" ? parsed.sizing : {},
			pinning:
				parsed.pinning && typeof parsed.pinning === "object"
					? {
							left: parsed.pinning.left?.map(String),
							right: parsed.pinning.right?.map(String),
						}
					: {},
		};
	} catch {
		return null;
	}
}

export function saveColumnLayout(layoutKey: string, layout: PersistedColumnLayout): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(columnLayoutStorageKey(layoutKey), JSON.stringify(layout));
	} catch {
		// Quota / private mode — layout still works in-memory for this mount.
	}
}

export function clearColumnLayout(layoutKey: string): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(columnLayoutStorageKey(layoutKey));
	} catch {
		/* ignore */
	}
}

/** Keep saved order in sync with current leaf columns (drop stale, append new). */
export function mergeColumnOrder(
	savedOrder: ColumnOrderState,
	leafColumnIds: string[]
): ColumnOrderState {
	if (leafColumnIds.length === 0) return [];
	if (savedOrder.length === 0) return leafColumnIds;
	const known = new Set(leafColumnIds);
	const ordered = savedOrder.filter((id) => known.has(id));
	const missing = leafColumnIds.filter((id) => !ordered.includes(id));
	return [...ordered, ...missing];
}

export function resolveColumnOrder<TData>(table: Table<TData>): ColumnOrderState {
	const leafIds = table.getAllLeafColumns().map((column) => column.id);
	return mergeColumnOrder(table.getState().columnOrder, leafIds);
}

export function moveColumn<TData>(
	table: Table<TData>,
	columnId: string,
	direction: -1 | 1
): void {
	const order = resolveColumnOrder(table);
	const index = order.indexOf(columnId);
	if (index < 0) return;
	const nextIndex = index + direction;
	if (nextIndex < 0 || nextIndex >= order.length) return;
	const next = [...order];
	const current = next[index]!;
	next[index] = next[nextIndex]!;
	next[nextIndex] = current;
	table.setColumnOrder(next);
}

/** Sticky pin styles for horizontal scroll (TanStack pinning guide). */
export function getCommonPinningStyles<TData, TValue>(
	column: Column<TData, TValue>,
	options?: { isHeader?: boolean }
): CSSProperties {
	const isPinned = column.getIsPinned();
	const isLastLeftPinned = isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinned = isPinned === "right" && column.getIsFirstColumn("right");
	const isHeader = options?.isHeader ?? false;

	return {
		width: column.getSize(),
		minWidth: column.getSize(),
		maxWidth: column.getSize(),
		position: isPinned ? "sticky" : "relative",
		left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
		right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
		zIndex: isPinned ? (isHeader ? 30 : 10) : isHeader ? 1 : 0,
		// Opaque fill so scrolled cells never show through pinned columns.
		background: isPinned
			? isHeader
				? "hsl(var(--muted))"
				: "hsl(var(--background))"
			: undefined,
		boxShadow: isLastLeftPinned
			? "inset -1px 0 0 hsl(var(--border))"
			: isFirstRightPinned
				? "inset 1px 0 0 hsl(var(--border))"
				: undefined,
	};
}
