import type { CSSProperties } from "react";
import type { Row } from "@tanstack/react-table";

/** Altezza header sticky (`h-12`) — offset per le righe pinnate in alto. */
export const TABLE_HEADER_STICKY_OFFSET_PX = 48;

/**
 * Stima altezza riga (`p-4` + testo sm). Usata solo per stack sticky multiplo;
 * allineamento non critico al pixel.
 */
export const TABLE_ROW_STICKY_ESTIMATE_PX = 53;

type RowPinningStyleOptions = {
	headerOffsetPx?: number;
	rowHeightPx?: number;
	/** Numero di righe pinnate in basso (per stack da bottom). */
	bottomPinnedCount?: number;
};

/**
 * Stili sticky verticali per una riga pinnata (scroll nel container overflow).
 * Da applicare sulle celle (sticky su `tr` è inconsistente nei browser).
 */
export function getRowPinningStyle<TData>(
	row: Row<TData>,
	options: RowPinningStyleOptions = {}
): CSSProperties {
	const pinned = row.getIsPinned();
	if (!pinned) return {};

	const headerOffset = options.headerOffsetPx ?? TABLE_HEADER_STICKY_OFFSET_PX;
	const rowHeight = options.rowHeightPx ?? TABLE_ROW_STICKY_ESTIMATE_PX;
	const index = Math.max(0, row.getPinnedIndex());

	if (pinned === "top") {
		return {
			position: "sticky",
			top: headerOffset + index * rowHeight,
			zIndex: 1,
		};
	}

	const bottomCount = options.bottomPinnedCount ?? index + 1;
	const fromBottom = Math.max(0, bottomCount - 1 - index);
	return {
		position: "sticky",
		bottom: fromBottom * rowHeight,
		zIndex: 1,
	};
}

/** Unisce sticky colonna + riga (left/right/top/bottom + z-index). */
export function mergeCellStickyStyles(
	columnStyle: CSSProperties,
	rowStyle: CSSProperties
): CSSProperties {
	const hasColumn =
		columnStyle.position === "sticky" ||
		columnStyle.left != null ||
		columnStyle.right != null;
	const hasRow =
		rowStyle.position === "sticky" ||
		rowStyle.top != null ||
		rowStyle.bottom != null;

	if (!hasColumn && !hasRow) return {};

	const zColumn = typeof columnStyle.zIndex === "number" ? columnStyle.zIndex : 0;
	const zRow = typeof rowStyle.zIndex === "number" ? rowStyle.zIndex : 0;

	return {
		...columnStyle,
		...rowStyle,
		position: "sticky",
		zIndex: hasColumn && hasRow ? Math.max(zColumn, zRow, 1) + 1 : Math.max(zColumn, zRow, 1),
	};
}
