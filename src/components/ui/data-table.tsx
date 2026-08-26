"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import TablePagination from "@/components/ui/data-table/table-pagination";
import { TableBulkBar, type DataTableBulkAction } from "@/components/ui/data-table/table-bulk-bar";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { TableErrorState } from "@/components/ui/data-table/table-error-state";
import { TableLoadingState } from "@/components/ui/data-table/table-loading-state";
import {
	RowActionsProvider,
	useRowActionsRegistry,
} from "@/components/ui/data-table/table-row-actions-context";
import {
	ACTIONS_COLUMN_ID,
	ACTIONS_COLUMN_SIZE,
	FALLBACK_COLUMN_SIZE,
	LOCKED_COLUMN_IDS,
	MIN_COLUMN_SIZE,
	SELECT_COLUMN_ID,
	ensureActionsTrailing,
	getColumnPinningStyle,
	getColumnWidthStyle,
	getPinnedLeafColumnOrder,
	moveColumnInOrder,
	structuralColumnPinning,
	resolveColumnSize,
	SELECT_COLUMN_SIZE,
} from "@/components/ui/data-table/table-column-layout";
import {
	ColumnLayoutProvider,
	useColumnLayout,
	useFontsReady,
	type ColumnMinSizeSource,
} from "@/components/ui/data-table/table-column-layout-context";
import {
	ColumnWidthProbe,
	type ColumnWidthSample,
} from "@/components/ui/data-table/table-column-width-probe";
import { SearchHighlightProvider } from "@/components/ui/data-table/search-highlight-context";
import {
	MAX_PINNED_ROWS,
	clampRowPinning,
	mergeOffPagePinnedRows,
	pinnedRowIdSet,
	syncPinnedRowBag,
} from "@/components/ui/data-table/table-row-pinning";
import TableToolbar from "@/components/ui/data-table/table-toolbar";
import { HighlightValueCell } from "@/components/ui/highlight-text";
import { OverflowText } from "@/components/ui/overflow-text";

import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ListFacetedFilter, ListFilters } from "@/lib/list";
import { cn } from "@/lib/utils";
import {
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	Header,
	PaginationState,
	Row,
	RowPinningState,
	RowSelectionState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	Pencil,
	Pin,
	PinOff,
	Trash2,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

export type { DataTableBulkAction };

const TABLE_HEADER_SURFACE = "table-header-surface";
const TABLE_ROW_PINNED_SURFACE = "table-row-pinned-surface";

function DataTableHeaderCell<TData, TValue>({
	header,
}: {
	header: Header<TData, TValue>;
}) {
	const columnLayout = useColumnLayout();
	const column = header.column;
	const canSort = column.getCanSort();
	const sorted = column.getIsSorted();
	const canReorder = !!columnLayout && !LOCKED_COLUMN_IDS.has(column.id);
	const pinned = column.getIsPinned();
	const size = header.getSize();
	const hasMenu = !header.isPlaceholder && (canSort || canReorder);

	const head = (
		<TableHead
			colSpan={header.colSpan}
			aria-sort={
				sorted === "asc"
					? "ascending"
					: sorted === "desc"
						? "descending"
						: canSort
							? "none"
							: undefined
			}
			className={cn(
				"box-border overflow-hidden",
				TABLE_HEADER_SURFACE,
				canSort && "cursor-pointer",
				!canSort && hasMenu && "cursor-context-menu",
				column.id === SELECT_COLUMN_ID && "table-col-pin-edge"
			)}
			style={{
				...getColumnWidthStyle(size),
				...getColumnPinningStyle(column),
				zIndex: pinned ? 3 : 1,
			}}
		>
			{header.isPlaceholder
				? null
				: flexRender(column.columnDef.header, header.getContext())}
		</TableHead>
	);

	if (!hasMenu) return head;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{head}</ContextMenuTrigger>
			<ContextMenuContent className="min-w-48">
				{canSort ? (
					<>
						<ContextMenuItem onSelect={() => column.toggleSorting(false)}>
							<ArrowUpIcon />
							Ordina crescente
						</ContextMenuItem>
						<ContextMenuItem onSelect={() => column.toggleSorting(true)}>
							<ArrowDownIcon />
							Ordina decrescente
						</ContextMenuItem>
					</>
				) : null}
				{canSort && canReorder ? <ContextMenuSeparator /> : null}
				{canReorder ? (
					<>
						<ContextMenuItem
							onSelect={() => columnLayout?.moveColumn(column.id, -1)}
						>
							<ArrowLeftIcon />
							Sposta a sinistra
						</ContextMenuItem>
						<ContextMenuItem
							onSelect={() => columnLayout?.moveColumn(column.id, 1)}
						>
							<ArrowRightIcon />
							Sposta a destra
						</ContextMenuItem>
					</>
				) : null}
			</ContextMenuContent>
		</ContextMenu>
	);
}

/** Controlli server-side (ticket 19). Se assente → comportamento client legacy. */
export type DataTableServerListProps = {
	manual: true;
	pageCount: number;
	rowCount: number;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	/** Draft filters (keystroke); applicati solo su Filtra. */
	draftFilters: ListFilters;
	onDraftFilterChange: (key: string, value: string | string[] | undefined) => void;
	onApplyFilters: () => void;
	onResetFilters: () => void;
	filtersDirty?: boolean;
	/** Filtri applicati (ultimo fetch) — distingue empty filtri vs dataset. */
	appliedFilters?: ListFilters;
};

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Chiavi filtro toolbar (native o join mappati lato server). */
	filters: string[];
	/** Filtri enum/boolean a multi-select (esclusi automaticamente dalle textbox). */
	facetedFilters?: ListFacetedFilter[];
	/** Override placeholder per chiave filtro. */
	filterLabels?: Record<string, string>;
	/** Empty dataset (zero record, senza filtri applicati). */
	emptyState?: React.ReactNode;
	/** Empty da filtri (default: messaggio + Reimposta se serverList). */
	filteredEmptyState?: React.ReactNode;
	/** Loading lista sulla shell condivisa (corpo tabella). */
	isLoading?: boolean;
	/** Fetch fallito → errore + retry. */
	error?: Error | null;
	onRetry?: () => void;
	className?: string;
	serverList?: DataTableServerListProps;
	/** Stable row id (richiesto per multi-select con PK composite). */
	getRowId?: (originalRow: TData, index: number) => string;
	/** Nome dominio per copy bulk delete (es. "Cliente"). */
	entityLabel?: string;
	/** Elimina una riga selezionata (bulk); abilita checkbox + barra azioni. */
	bulkDeleteRow?: (row: TData) => Promise<void>;
	/** Azioni bulk extra (es. Approva Account). */
	bulkActions?: DataTableBulkAction<TData>[];
	/** Dopo bulk riuscito (anche parziale) — tipicamente refetch. */
	onBulkComplete?: () => void;
	/** Azioni pagina a sinistra della riga chrome (Aggiungi, hint, …). */
	toolbarActions?: React.ReactNode;
}

function hasAppliedFilters(filters: ListFilters | undefined): boolean {
	if (!filters) return false;
	return Object.keys(filters).some((key) => {
		const value = filters[key];
		if (value == null) return false;
		if (Array.isArray(value)) return value.length > 0;
		return String(value).trim() !== "";
	});
}

/** Chiave stabile per invalidare la selezione quando cambia il working set (filtri). */
function listFiltersIdentity(filters: ListFilters | undefined): string {
	if (!filters) return "";
	const keys = Object.keys(filters).sort();
	if (keys.length === 0) return "";
	return keys
		.map((key) => {
			const value = filters[key];
			if (value == null) return `${key}=`;
			if (Array.isArray(value)) return `${key}=${value.map(String).sort().join(",")}`;
			if (typeof value === "boolean") return `${key}=${value ? "1" : "0"}`;
			return `${key}=${String(value)}`;
		})
		.join("&");
}

function columnFiltersIdentity(filters: ColumnFiltersState): string {
	if (filters.length === 0) return "";
	return filters
		.map((filter) => `${filter.id}:${JSON.stringify(filter.value)}`)
		.sort()
		.join("|");
}

function columnDefId<TData, TValue>(
	col: ColumnDef<TData, TValue>
): string | undefined {
	if (col.id) return col.id;
	if ("accessorKey" in col && col.accessorKey != null) return String(col.accessorKey);
	return undefined;
}

/** Colonne senza `cell` custom: evidenzia il value se c'è filtro applicato sulla stessa chiave. */
function withDefaultSearchHighlightCell<TData, TValue>(
	col: ColumnDef<TData, TValue>
): ColumnDef<TData, TValue> {
	if (col.cell) return col;
	const id = columnDefId(col);
	if (!id || id === ACTIONS_COLUMN_ID || id === SELECT_COLUMN_ID) return col;
	return {
		...col,
		cell: ({ getValue }) => (
			<HighlightValueCell value={getValue()} filterKeys={id} />
		),
	};
}

function DataTableRow<TData>({
	row,
	mountHiddenActions,
}: {
	row: Row<TData>;
	mountHiddenActions: boolean;
}) {
	const registry = useRowActionsRegistry();
	const [menuActions, setMenuActions] = React.useState<
		ReturnType<typeof registry.get>
	>(undefined);
	const [hovered, setHovered] = React.useState(false);
	const selected = row.getIsSelected();
	const rowPinned = row.getIsPinned();
	const canPin = row.getCanPin();

	const actionCell = row
		.getAllCells()
		.find((cell) => cell.column.id === ACTIONS_COLUMN_ID);
	const actionHost =
		mountHiddenActions && actionCell
			? createPortal(
					<div hidden>
						{flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
					</div>,
					document.body
				)
			: null;

	const cells = row.getVisibleCells().map((cell) => {
		const colPinned = cell.column.getIsPinned();
		const size = cell.column.getSize();
		const stacked = cell.column.columnDef.meta?.stacked === true;
		const skipOverflow =
			cell.column.id === ACTIONS_COLUMN_ID ||
			cell.column.id === SELECT_COLUMN_ID ||
			stacked ||
			cell.column.columnDef.meta?.noCellOverflow === true;
		const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
		const stickyCover = Boolean(colPinned || rowPinned);
		return (
			<TableCell
				key={cell.id}
				className={cn(
					"box-border h-12 max-h-12 overflow-hidden py-0",
					!stacked && "whitespace-nowrap",
					cell.column.id === SELECT_COLUMN_ID && "table-col-pin-edge",
					selected
						? "bg-muted"
						: hovered
							? stickyCover
								? "bg-muted"
								: "bg-muted/50"
							: rowPinned
								? TABLE_ROW_PINNED_SURFACE
								: colPinned
									? "bg-background"
									: undefined
				)}
				style={{
					...getColumnWidthStyle(size),
					...getColumnPinningStyle(cell.column),
				}}
			>
				{skipOverflow ? (
					<div className="flex h-full min-w-0 max-w-full items-center overflow-hidden">
						{rendered}
					</div>
				) : (
					<OverflowText always>{rendered}</OverflowText>
				)}
			</TableCell>
		);
	});

	const hasRowCrud =
		!!menuActions?.canEdit ||
		!!menuActions?.canDelete ||
		(menuActions?.extraActions?.length ?? 0) > 0;

	return (
		<>
			{actionHost}
			<ContextMenu
				onOpenChange={(open) => {
					if (open) setMenuActions(registry.get(row.id));
					else setMenuActions(undefined);
				}}
			>
			<ContextMenuTrigger asChild>
				<TableRow
					className="transition-none hover:bg-transparent data-[state=selected]:bg-transparent"
					data-state={selected && "selected"}
					data-pinned={rowPinned || undefined}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
				>
					{cells}
				</TableRow>
			</ContextMenuTrigger>
			<ContextMenuContent className="min-w-48">
				<ContextMenuLabel>Azioni</ContextMenuLabel>
				<ContextMenuSeparator />
				{menuActions?.canEdit ? (
					<ContextMenuItem onSelect={() => menuActions.openEdit()}>
						<Pencil />
						Modifica
					</ContextMenuItem>
				) : null}
				{menuActions?.extraActions?.map((item) => {
					const ExtraIcon = item.icon;
					return (
						<ContextMenuItem
							key={item.id}
							disabled={item.disabled}
							className={
								item.destructive ? "text-destructive focus:text-destructive" : undefined
							}
							onSelect={() => item.onSelect()}
						>
							{ExtraIcon ? <ExtraIcon /> : null}
							{item.label}
						</ContextMenuItem>
					);
				})}
				{menuActions?.canDelete ? (
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => menuActions.openDelete()}
					>
						<Trash2 />
						Elimina
					</ContextMenuItem>
				) : null}
				{hasRowCrud ? <ContextMenuSeparator /> : null}
				{rowPinned ? (
					<ContextMenuItem onSelect={() => row.pin(false)}>
						<PinOff />
						Sblocca riga
					</ContextMenuItem>
				) : (
					<ContextMenuItem
						disabled={!canPin}
						onSelect={() => row.pin("top")}
					>
						<Pin />
						{canPin
							? "Fissa in alto"
							: `Fissa in alto (max ${MAX_PINNED_ROWS})`}
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
		</>
	);
}

function DataTableInner<TData, TValue>({
	columns,
	data,
	filters,
	facetedFilters,
	filterLabels,
	emptyState,
	filteredEmptyState,
	isLoading = false,
	error = null,
	onRetry,
	className,
	serverList,
	getRowId,
	entityLabel = "elemento",
	bulkDeleteRow,
	bulkActions,
	onBulkComplete,
	toolbarActions,
}: DataTableProps<TData, TValue>) {
	const isServer = !!serverList?.manual;
	const filtersActive = hasAppliedFilters(serverList?.appliedFilters);
	const enableSelection = !!bulkDeleteRow || (bulkActions?.length ?? 0) > 0;

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
		[ACTIONS_COLUMN_ID]: false,
	});
	const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
	const columnPinning = React.useMemo(
		() => structuralColumnPinning(enableSelection),
		[enableSelection]
	);
	const [columnMinSizes, setColumnMinSizes] = React.useState<
		Record<string, Partial<Record<ColumnMinSizeSource, number>>>
	>({});
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
	const [rowPinning, setRowPinning] = React.useState<RowPinningState>({
		top: [],
		bottom: [],
	});
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [mountHiddenActions, setMountHiddenActions] = React.useState(false);
	React.useLayoutEffect(() => {
		setMountHiddenActions(true);
	}, []);

	const fontsReady = useFontsReady();
	const hasStableRowId = typeof getRowId === "function";
	const pinnedBagRef = React.useRef(new Map<string, TData>());
	const pinnedIds = React.useMemo(() => pinnedRowIdSet(rowPinning), [rowPinning]);
	syncPinnedRowBag(pinnedBagRef.current, data, getRowId, pinnedIds);
	const tableData = React.useMemo(() => {
		if (!isServer || !hasStableRowId) return data;
		return mergeOffPagePinnedRows(
			data,
			getRowId,
			rowPinning,
			pinnedBagRef.current
		);
	}, [isServer, hasStableRowId, data, getRowId, rowPinning, pinnedIds]);

	const setColumnMinSize = React.useCallback(
		(source: ColumnMinSizeSource, columnId: string, minSize: number) => {
			if (!columnId || minSize <= 0) return;
			const next = Math.ceil(minSize);
			setColumnMinSizes((prev) => {
				if (prev[columnId]?.[source] === next) return prev;
				return { ...prev, [columnId]: { ...prev[columnId], [source]: next } };
			});
		},
		[]
	);

	const measureContentMinSize = React.useCallback(
		(columnId: string, minSize: number) => {
			setColumnMinSize("content", columnId, minSize);
		},
		[setColumnMinSize]
	);

	const selectColumn = React.useMemo<ColumnDef<TData, TValue>>(
		() => ({
			id: "__select",
			enableSorting: false,
			enableHiding: false,
			enablePinning: false,
			header: ({ table }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						aria-label="Seleziona tutte le righe visibili"
						checked={
							table.getIsAllPageRowsSelected()
								? true
								: table.getIsSomePageRowsSelected()
									? "indeterminate"
									: false
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						aria-label="Seleziona riga"
						checked={row.getIsSelected()}
						disabled={!row.getCanSelect()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						onClick={(event) => event.stopPropagation()}
					/>
				</div>
			),
			size: SELECT_COLUMN_SIZE,
			minSize: SELECT_COLUMN_SIZE,
			maxSize: SELECT_COLUMN_SIZE,
		}),
		[]
	);

	const tableColumns = React.useMemo(() => {
		const base = enableSelection ? [selectColumn, ...columns] : [...columns];
		return base.map((col) => {
			const withHighlight = withDefaultSearchHighlightCell(col);
			const id = columnDefId(withHighlight);
			if (id === ACTIONS_COLUMN_ID) {
				return {
					...withHighlight,
					enableHiding: false,
					enablePinning: false,
					size: ACTIONS_COLUMN_SIZE,
					minSize: ACTIONS_COLUMN_SIZE,
					maxSize: ACTIONS_COLUMN_SIZE,
				};
			}
			if (!id || id === SELECT_COLUMN_ID) return withHighlight;

			const measured = columnMinSizes[id];
			const size = resolveColumnSize({
				width: withHighlight.meta?.width,
				measuredMinSize: Math.max(measured?.header ?? 0, measured?.content ?? 0),
				declaredSize: withHighlight.size,
			});
			// size === minSize === maxSize: la colonna non è negoziabile né ridimensionabile.
			return { ...withHighlight, size, minSize: size, maxSize: size };
		});
	}, [enableSelection, selectColumn, columns, columnMinSizes]);

	const widthSamples = React.useMemo(() => {
		const collected: ColumnWidthSample[] = [];
		for (const col of columns) {
			const id = columnDefId(col);
			const samples = col.meta?.widthSamples;
			if (!id || !samples?.length) continue;
			for (const node of samples) collected.push({ columnId: id, node });
		}
		return collected;
	}, [columns]);

	const leafColumnIds = React.useMemo(
		() => tableColumns.map((col) => columnDefId(col) ?? "").filter(Boolean),
		[tableColumns]
	);

	const table = useReactTable({
		data: tableData,
		columns: tableColumns,
		defaultColumn: {
			minSize: MIN_COLUMN_SIZE,
			size: FALLBACK_COLUMN_SIZE,
			enablePinning: false,
		},
		enableColumnResizing: false,
		enableColumnPinning: true,
		enableRowPinning: (row) =>
			Boolean(row.getIsPinned()) || pinnedIds.size < MAX_PINNED_ROWS,
		/** Con getRowId stabile le righe restano fissate anche cambiando pagina. */
		keepPinnedRows: hasStableRowId,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
		enableRowSelection: enableSelection,
		onRowSelectionChange: setRowSelection,
		onRowPinningChange: (updater) => {
			setRowPinning((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				return clampRowPinning(next);
			});
		},
		manualSorting: isServer,
		manualFiltering: isServer,
		manualPagination: isServer,
		/** Click header: solo ASC ↔ DESC, senza tornare al sort di default. */
		enableSortingRemoval: false,
		pageCount: isServer ? serverList.pageCount : undefined,
		rowCount: isServer ? serverList.rowCount : undefined,
		onSortingChange: isServer ? serverList.onSortingChange : setSorting,
		onPaginationChange: isServer ? serverList.onPaginationChange : setPagination,
		onColumnFiltersChange: isServer ? undefined : setColumnFilters,
		getPaginationRowModel: isServer ? undefined : getPaginationRowModel(),
		getSortedRowModel: isServer ? undefined : getSortedRowModel(),
		getFilteredRowModel: isServer ? undefined : getFilteredRowModel(),
		getFacetedRowModel: isServer ? undefined : getFacetedRowModel(),
		getFacetedUniqueValues: isServer ? undefined : getFacetedUniqueValues(),
		onColumnVisibilityChange: (updater) => {
			setColumnVisibility((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				return { ...next, [ACTIONS_COLUMN_ID]: false };
			});
		},
		onColumnOrderChange: (updater) => {
			setColumnOrder((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				return ensureActionsTrailing(next);
			});
		},
		state: {
			sorting: isServer ? serverList.sorting : sorting,
			columnFilters: isServer ? [] : columnFilters,
			columnVisibility,
			columnOrder,
			columnPinning,
			pagination: isServer ? serverList.pagination : pagination,
			rowSelection,
			rowPinning,
		},
	});

	const moveColumn = React.useCallback(
		(columnId: string, direction: -1 | 1) => {
			setColumnOrder((prev) =>
				ensureActionsTrailing(
					moveColumnInOrder(prev, leafColumnIds, columnId, direction)
				)
			);
		},
		[leafColumnIds]
	);

	const pageIndex = isServer ? serverList.pagination.pageIndex : pagination.pageIndex;
	const pageSize = isServer ? serverList.pagination.pageSize : pagination.pageSize;
	const dataIdentity = React.useMemo(
		() => data.map((_, i) => (getRowId ? getRowId(data[i], i) : String(i))).join("|"),
		[data, getRowId]
	);

	const selectionScopeKey = isServer
		? listFiltersIdentity(serverList?.appliedFilters)
		: columnFiltersIdentity(columnFilters);
	const prevSelectionScopeKeyRef = React.useRef(selectionScopeKey);
	if (selectionScopeKey !== prevSelectionScopeKeyRef.current) {
		prevSelectionScopeKeyRef.current = selectionScopeKey;
		if (Object.keys(rowSelection).length > 0) {
			setRowSelection({});
		}
		if ((rowPinning.top?.length ?? 0) > 0 || (rowPinning.bottom?.length ?? 0) > 0) {
			setRowPinning({ top: [], bottom: [] });
		}
	}

	React.useEffect(() => {
		if (hasStableRowId) return;
		setRowPinning({ top: [], bottom: [] });
	}, [pageIndex, pageSize, dataIdentity, hasStableRowId]);

	React.useEffect(() => {
		if (hasStableRowId) return;
		setRowSelection({});
	}, [pageIndex, pageSize, dataIdentity, hasStableRowId]);

	const selectedBagRef = React.useRef(new Map<string, TData>());
	const selectedBag = selectedBagRef.current;
	for (let i = 0; i < data.length; i++) {
		const id = getRowId ? getRowId(data[i], i) : String(i);
		if (rowSelection[id]) selectedBag.set(id, data[i]);
		else selectedBag.delete(id);
	}
	for (const id of [...selectedBag.keys()]) {
		if (!rowSelection[id]) selectedBag.delete(id);
	}
	const selectedRows = React.useMemo(
		() => [...selectedBagRef.current.values()],
		[data, rowSelection, getRowId]
	);

	const clearSelection = React.useCallback(() => {
		setRowSelection({});
	}, []);

	const topRows = table.getTopRows();
	const centerRows = table.getCenterRows();
	const bottomRows = table.getBottomRows();
	const pageSelectedCount = table.getSelectedRowModel().rows.length;
	const colSpan = table.getVisibleLeafColumns().length;
	const orderedLeafColumns = getPinnedLeafColumnOrder(table);
	const hasBodyRows =
		topRows.length + centerRows.length + bottomRows.length > 0;
	const showLoading = isLoading && !hasBodyRows && !error;
	const showError = !!error;
	const showEmpty = !showLoading && !showError && !hasBodyRows;

	const defaultFilteredEmpty = (
		<TableEmptyState
			title="Nessun risultato"
			hint="Nessun elemento corrisponde ai filtri applicati. Prova ad ampliarli o a ripristinarli."
			action={
				serverList?.onResetFilters ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={serverList.onResetFilters}
					>
						Reimposta filtri
					</Button>
				) : undefined
			}
		/>
	);

	const defaultDatasetEmpty = (
		<TableEmptyState
			title="Nessun risultato"
			hint="Registra un nuovo elemento per iniziare."
		/>
	);

	let bodyContent: React.ReactNode = null;
	if (showError) {
		bodyContent = (
			<TableErrorState
				message={
					error instanceof Error && error.message
						? error.message
						: undefined
				}
				onRetry={onRetry}
			/>
		);
	} else if (showLoading) {
		bodyContent = <TableLoadingState />;
	} else if (showEmpty) {
		bodyContent =
			filtersActive
				? (filteredEmptyState ?? defaultFilteredEmpty)
				: (emptyState ?? defaultDatasetEmpty);
	}

	return (
		<SearchHighlightProvider filters={isServer ? serverList?.appliedFilters : undefined}>
		<ColumnLayoutProvider
			moveColumn={moveColumn}
			setColumnMinSize={setColumnMinSize}
			fontsReady={fontsReady}
		>
		<div
			className="flex h-full min-h-0 min-w-0 flex-col"
			aria-busy={isLoading || undefined}
		>
			<ColumnWidthProbe
				samples={widthSamples}
				fontsReady={fontsReady}
				onMeasure={measureContentMinSize}
			/>
			<div className="flex h-14 shrink-0 items-center gap-2 px-4 py-2">
				<TableToolbar
					table={table}
					filters={filters}
					facetedFilters={facetedFilters}
					filterLabels={filterLabels}
					toolbarActions={toolbarActions}
					serverList={
						isServer
							? {
									draftFilters: serverList.draftFilters,
									onDraftFilterChange: serverList.onDraftFilterChange,
									onApplyFilters: serverList.onApplyFilters,
									onResetFilters: serverList.onResetFilters,
									filtersDirty: serverList.filtersDirty,
									appliedFilters: serverList.appliedFilters,
								}
							: undefined
					}
				/>
			</div>
			<Separator className="shrink-0" />
			<div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-md border">
				<div className="min-h-0 min-w-0 flex-1 overflow-auto contain-paint">
				<div className="w-max border-r border-border">
				<Table
					// `w-auto`: la larghezza è la somma delle colonne, non quella del parent.
					className={cn(
						"w-auto table-fixed [&_tr_td:last-child]:w-auto [&_tr_th:last-child]:w-auto",
						className
					)}
					style={{ width: table.getTotalSize() }}
				>
					<colgroup>
						{orderedLeafColumns.map((column) => (
							<col
								key={column.id}
								style={getColumnWidthStyle(column.getSize())}
							/>
						))}
					</colgroup>
					<TableHeader className="sticky top-0 z-20 isolate bg-background [&_tr]:border-0 [&_tr]:shadow-[inset_0_-1px_0] [&_tr]:shadow-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className={cn(TABLE_HEADER_SURFACE, "hover:bg-transparent")}
							>
								{headerGroup.headers.map((header) => (
									<DataTableHeaderCell key={header.id} header={header} />
								))}
							</TableRow>
						))}
						{!bodyContent
							? topRows.map((row) => (
									<DataTableRow
										key={`pin-top-${row.id}`}
										row={row}
										mountHiddenActions={mountHiddenActions}
									/>
								))
							: null}
					</TableHeader>
					<TableBody>
						{bodyContent ? (
							<TableRow>
								<TableCell
									colSpan={colSpan}
									className="h-24 text-center"
								>
									{bodyContent}
								</TableCell>
							</TableRow>
						) : (
							<>
								{centerRows.map((row) => (
									<DataTableRow
										key={row.id}
										row={row}
										mountHiddenActions={mountHiddenActions}
									/>
								))}
							</>
						)}
					</TableBody>
					{!bodyContent && bottomRows.length > 0 ? (
						<TableFooter className="sticky bottom-0 z-20 isolate bg-background font-normal [&_tr]:border-0 [&_tr]:shadow-[inset_0_1px_0] [&_tr]:shadow-border">
							{bottomRows.map((row) => (
								<DataTableRow
									key={`pin-bottom-${row.id}`}
									row={row}
									mountHiddenActions={mountHiddenActions}
								/>
							))}
						</TableFooter>
					) : null}
				</Table>
				</div>
				</div>
			</div>
			<div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 pt-4">
				<div className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-2">
					{enableSelection ? (
						<TableBulkBar
							selectedRows={selectedRows}
							pageSelectedCount={pageSelectedCount}
							entityLabel={entityLabel}
							bulkDeleteRow={bulkDeleteRow}
							bulkActions={bulkActions}
							onComplete={() => onBulkComplete?.()}
							onClearSelection={clearSelection}
						/>
					) : null}
				</div>
				<TablePagination table={table} />
			</div>
			</div>
		</div>
		</ColumnLayoutProvider>
		</SearchHighlightProvider>
	);
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
	return (
		<RowActionsProvider>
			<DataTableInner {...props} />
		</RowActionsProvider>
	);
}
