import type { CSSProperties } from "react";
import type { Row, RowPinningState } from "@tanstack/react-table";

/** Altezza header sticky (`h-12`) — offset per le righe pinnate in alto. */
export const TABLE_HEADER_STICKY_OFFSET_PX = 48;

/**
 * Tetto operativo: 5 × ~53px + header restano sotto una viewport da lista,
 * senza coprire la pagina corrente. Confronto sì, watchlist illimitata no.
 */
export const MAX_PINNED_ROWS = 5;

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

function resolveRowId<TData>(
	row: TData,
	index: number,
	getRowId?: (originalRow: TData, index: number) => string
): string {
	return getRowId ? getRowId(row, index) : String(index);
}

export function pinnedRowIdSet(pinning: RowPinningState): Set<string> {
	return new Set([...(pinning.top ?? []), ...(pinning.bottom ?? [])]);
}

/** I pin nuovi sono in coda: se si supera il tetto, si scartano gli ultimi. */
export function clampRowPinning(
	pinning: RowPinningState,
	max = MAX_PINNED_ROWS
): RowPinningState {
	const top = pinning.top ?? [];
	const bottom = pinning.bottom ?? [];
	const extra = top.length + bottom.length - max;
	if (extra <= 0) return pinning;
	if (top.length >= extra) {
		return { top: top.slice(0, top.length - extra), bottom };
	}
	return { top: [], bottom: bottom.slice(0, bottom.length - (extra - top.length)) };
}

/** Allinea il bag agli id pinnati e aggiorna gli originali visibili nella pagina. */
export function syncPinnedRowBag<TData>(
	bag: Map<string, TData>,
	data: TData[],
	getRowId: ((originalRow: TData, index: number) => string) | undefined,
	pinnedIds: Set<string>
): void {
	for (let i = 0; i < data.length; i++) {
		const id = resolveRowId(data[i], i, getRowId);
		if (pinnedIds.has(id)) bag.set(id, data[i]);
	}
	for (const id of [...bag.keys()]) {
		if (!pinnedIds.has(id)) bag.delete(id);
	}
}

/**
 * Con paginazione server la pagina non contiene le righe fissate altrove:
 * le reintegra dal bag così TanStack può renderizzarle in `getTopRows`.
 */
export function mergeOffPagePinnedRows<TData>(
	data: TData[],
	getRowId: ((originalRow: TData, index: number) => string) | undefined,
	pinning: RowPinningState,
	bag: Map<string, TData>
): TData[] {
	const currentIds = new Set(
		data.map((row, index) => resolveRowId(row, index, getRowId))
	);
	const extras: TData[] = [];
	const seen = new Set<string>();
	for (const id of [...(pinning.top ?? []), ...(pinning.bottom ?? [])]) {
		if (seen.has(id) || currentIds.has(id)) continue;
		seen.add(id);
		const original = bag.get(id);
		if (original) extras.push(original);
	}
	return extras.length > 0 ? [...extras, ...data] : data;
}
