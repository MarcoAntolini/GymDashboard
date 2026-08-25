import type { RowPinningState } from "@tanstack/react-table";

/**
 * Tetto operativo: 5 × h-12 + header restano sotto una viewport da lista,
 * senza coprire la pagina corrente. Confronto sì, watchlist illimitata no.
 */
export const MAX_PINNED_ROWS = 5;

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
