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
	SELECT_COLUMN_ID,
	ensureActionsTrailing,
	getColumnPinningStyle,
	getColumnWidthStyle,
	getFlexFillColumnId,
	getPinnedLeafColumnOrder,
	moveColumnInOrder,
	normalizeColumnPinning,
	SELECT_COLUMN_SIZE,
} from "@/components/ui/data-table/table-column-layout";
import { ColumnLayoutProvider } from "@/components/ui/data-table/table-column-layout-context";
import { SearchHighlightProvider } from "@/components/ui/data-table/search-highlight-context";
import {
	getRowPinningStyle,
	mergeCellStickyStyles,
} from "@/components/ui/data-table/table-row-pinning";
import TableToolbar from "@/components/ui/data-table/table-toolbar";
import { HighlightValueCell } from "@/components/ui/highlight-text";
import { OverflowText } from "@/components/ui/overflow-text";

import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ListFacetedFilter, ListFilters } from "@/lib/list";
import { cn } from "@/lib/utils";
import {
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	ColumnSizingState,
	OnChangeFn,
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
import * as React from "react";
import { createPortal } from "react-dom";

export type { DataTableBulkAction };

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

/** Colonne senza `cell` custom: evidenzia il value se c'è filtro applicato sulla stessa chiave. */
function withDefaultSearchHighlightCell<TData, TValue>(
	col: ColumnDef<TData, TValue>
): ColumnDef<TData, TValue> {
	if (col.cell) return col;
	const id =
		col.id ??
		("accessorKey" in col && col.accessorKey != null
			? String(col.accessorKey)
			: undefined);
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
	flexFillColumnId,
	bottomPinnedCount,
	mountHiddenActions,
}: {
	row: Row<TData>;
	flexFillColumnId: string | null;
	bottomPinnedCount: number;
	mountHiddenActions: boolean;
}) {
	const registry = useRowActionsRegistry();
	const [menuActions, setMenuActions] = React.useState<
		ReturnType<typeof registry.get>
	>(undefined);
	const [hovered, setHovered] = React.useState(false);
	const selected = row.getIsSelected();
	const rowPinned = row.getIsPinned();
	const rowSticky = getRowPinningStyle(row, { bottomPinnedCount });
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
		const sticky = mergeCellStickyStyles(
			getColumnPinningStyle(cell.column),
			rowSticky
		);
		const stacked = cell.column.columnDef.meta?.stacked === true;
		const skipOverflow =
			cell.column.id === ACTIONS_COLUMN_ID ||
			cell.column.id === SELECT_COLUMN_ID ||
			stacked ||
			cell.column.columnDef.meta?.noCellOverflow === true;
		const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
		return (
			<TableCell
				key={cell.id}
				className={cn(
					"box-border h-12 max-h-12 overflow-hidden py-0",
					!stacked && "whitespace-nowrap",
					colPinned && "shadow-[inset_-1px_0_0] shadow-border",
					rowPinned === "top" && "shadow-[inset_0_-1px_0] shadow-border",
					selected
						? "bg-muted"
						: hovered
							? "bg-muted/50"
							: rowPinned
								? "bg-muted/40"
								: colPinned
									? "bg-background"
									: undefined
				)}
				style={{
					...getColumnWidthStyle(cell.column.id, size, flexFillColumnId),
					...sticky,
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
					className="hover:bg-transparent data-[state=selected]:bg-transparent"
					data-state={selected && "selected"}
					data-pinned={rowPinned || undefined}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
				>
					{cells}
				</TableRow>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuLabel>Azioni</ContextMenuLabel>
				<ContextMenuSeparator />
				{menuActions?.canEdit ? (
					<ContextMenuItem onSelect={() => menuActions.openEdit()}>
						Modifica
					</ContextMenuItem>
				) : null}
				{menuActions?.extraActions?.map((item) => (
					<ContextMenuItem
						key={item.id}
						disabled={item.disabled}
						className={
							item.destructive ? "text-destructive focus:text-destructive" : undefined
						}
						onSelect={() => item.onSelect()}
					>
						{item.label}
					</ContextMenuItem>
				))}
				{menuActions?.canDelete ? (
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => menuActions.openDelete()}
					>
						Elimina
					</ContextMenuItem>
				) : null}
				{canPin ? (
					<>
						{hasRowCrud ? <ContextMenuSeparator /> : null}
						{rowPinned ? (
							<ContextMenuItem onSelect={() => row.pin(false)}>
								Sblocca riga
							</ContextMenuItem>
						) : (
							<ContextMenuItem onSelect={() => row.pin("top")}>
								Fissa in alto
							</ContextMenuItem>
						)}
					</>
				) : null}
				{!hasRowCrud && !canPin ? (
					<ContextMenuItem disabled>Nessuna azione</ContextMenuItem>
				) : null}
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
	const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() =>
		normalizeColumnPinning(
			{ left: [], right: [] },
			{
				hasSelect: !!bulkDeleteRow || (bulkActions?.length ?? 0) > 0,
				hasActions: false,
			}
		)
	);
	const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
	const [headerMinSizes, setHeaderMinSizes] = React.useState<Record<string, number>>(
		{}
	);
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

	const ensureHeaderMinSize = React.useCallback((columnId: string, minSize: number) => {
		if (!columnId || minSize <= 0) return;
		setHeaderMinSizes((prev) => {
			if ((prev[columnId] ?? 0) >= minSize) return prev;
			return { ...prev, [columnId]: minSize };
		});
		setColumnSizing((prev) => {
			const current = prev[columnId];
			if (current == null || current >= minSize) return prev;
			return { ...prev, [columnId]: minSize };
		});
	}, []);

	const selectColumn = React.useMemo<ColumnDef<TData, TValue>>(
		() => ({
			id: "__select",
			enableSorting: false,
			enableHiding: false,
			enableResizing: false,
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
			const id =
				withHighlight.id ??
				("accessorKey" in withHighlight && withHighlight.accessorKey != null
					? String(withHighlight.accessorKey)
					: undefined);
			if (id === ACTIONS_COLUMN_ID) {
				return {
					...withHighlight,
					enableResizing: false,
					enableHiding: false,
					enablePinning: false,
					size: ACTIONS_COLUMN_SIZE,
					minSize: ACTIONS_COLUMN_SIZE,
					maxSize: ACTIONS_COLUMN_SIZE,
				};
			}
			const headerMin = id ? headerMinSizes[id] : undefined;
			if (headerMin == null) return withHighlight;
			const nextMin = Math.max(withHighlight.minSize ?? 64, headerMin);
			const nextSize = Math.max(withHighlight.size ?? 160, headerMin);
			const nextMax = Math.max(withHighlight.maxSize ?? 480, nextMin);
			return {
				...withHighlight,
				minSize: nextMin,
				size: nextSize,
				maxSize: nextMax,
			};
		});
	}, [enableSelection, selectColumn, columns, headerMinSizes]);

	const leafColumnIds = React.useMemo(
		() =>
			tableColumns
				.map((col) =>
					col.id ??
					("accessorKey" in col && col.accessorKey != null
						? String(col.accessorKey)
						: "")
				)
				.filter(Boolean),
		[tableColumns]
	);

	React.useEffect(() => {
		setColumnPinning((prev) =>
			normalizeColumnPinning(prev, {
				hasSelect: enableSelection,
				hasActions: false,
			})
		);
	}, [enableSelection]);

	const onColumnPinningChange = React.useCallback<OnChangeFn<ColumnPinningState>>(
		(updater) => {
			setColumnPinning((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				return normalizeColumnPinning(next, {
					hasSelect: enableSelection,
					hasActions: false,
				});
			});
		},
		[enableSelection]
	);

	const table = useReactTable({
		data,
		columns: tableColumns,
		defaultColumn: {
			minSize: 64,
			size: 160,
			maxSize: 480,
		},
		columnResizeMode: "onChange",
		enableColumnResizing: true,
		enableColumnPinning: true,
		enableRowPinning: true,
		/** Pin solo sulle righe della pagina corrente (server-side + client). */
		keepPinnedRows: false,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
		enableRowSelection: enableSelection,
		onRowSelectionChange: setRowSelection,
		onRowPinningChange: setRowPinning,
		manualSorting: isServer,
		manualFiltering: isServer,
		manualPagination: isServer,
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
		onColumnPinningChange,
		onColumnSizingChange: setColumnSizing,
		state: {
			sorting: isServer ? serverList.sorting : sorting,
			columnFilters: isServer ? [] : columnFilters,
			columnVisibility,
			columnOrder,
			columnPinning,
			columnSizing,
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
	const hasStableRowId = typeof getRowId === "function";
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
	}

	React.useEffect(() => {
		setRowPinning({ top: [], bottom: [] });
	}, [pageIndex, pageSize, dataIdentity]);

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
	const bottomPinnedCount = bottomRows.length;
	const pageSelectedCount = table.getSelectedRowModel().rows.length;
	const colSpan = table.getVisibleLeafColumns().length;
	const orderedLeafColumns = getPinnedLeafColumnOrder(table);
	const flexFillColumnId = getFlexFillColumnId(
		orderedLeafColumns.map((column) => column.id)
	);
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
			ensureHeaderMinSize={ensureHeaderMinSize}
		>
		<div
			className="flex h-full min-h-0 min-w-0 flex-col"
			aria-busy={isLoading || undefined}
		>
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
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
			<div className="min-h-0 min-w-0 flex-1 overflow-auto contain-paint rounded-md border">
				<Table
					className={cn(
						"w-full table-fixed [&_tr_td:last-child]:w-auto [&_tr_th:last-child]:w-auto",
						className
					)}
					style={{ minWidth: table.getTotalSize() }}
				>
					<colgroup>
						{orderedLeafColumns.map((column) => (
							<col
								key={column.id}
								style={getColumnWidthStyle(
									column.id,
									column.getSize(),
									flexFillColumnId
								)}
							/>
						))}
					</colgroup>
					<TableHeader className="sticky top-0 z-20 bg-background [&_tr]:border-0 [&_tr]:shadow-[inset_0_-1px_0] [&_tr]:shadow-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="bg-stone-600/25">
								{headerGroup.headers.map((header) => {
									const pinned = header.column.getIsPinned();
									const size = header.getSize();
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
											className={cn(
												"relative box-border group/col overflow-hidden bg-stone-600/25",
												pinned && "shadow-[inset_-1px_0_0] shadow-border"
											)}
											style={{
												...getColumnWidthStyle(
													header.column.id,
													size,
													flexFillColumnId
												),
												...getColumnPinningStyle(header.column),
												zIndex: pinned ? 3 : undefined,
											}}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
											{header.column.getCanResize() &&
											header.column.id !== flexFillColumnId ? (
												<div
													role="separator"
													aria-orientation="vertical"
													aria-label={`Ridimensiona colonna ${header.column.id}`}
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													className={cn(
														"absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize touch-none select-none",
														"opacity-0 group-hover/col:opacity-100 bg-border hover:bg-primary",
														header.column.getIsResizing() && "opacity-100 bg-primary"
													)}
												/>
											) : null}
										</TableHead>
									);
								})}
							</TableRow>
						))}
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
								{topRows.map((row) => (
									<DataTableRow
										key={`pin-top-${row.id}`}
										row={row}
										flexFillColumnId={flexFillColumnId}
										bottomPinnedCount={bottomPinnedCount}
										mountHiddenActions={mountHiddenActions}
									/>
								))}
								{centerRows.map((row) => (
									<DataTableRow
										key={row.id}
										row={row}
										flexFillColumnId={flexFillColumnId}
										bottomPinnedCount={bottomPinnedCount}
										mountHiddenActions={mountHiddenActions}
									/>
								))}
								{bottomRows.map((row) => (
									<DataTableRow
										key={`pin-bottom-${row.id}`}
										row={row}
										flexFillColumnId={flexFillColumnId}
										bottomPinnedCount={bottomPinnedCount}
										mountHiddenActions={mountHiddenActions}
									/>
								))}
							</>
						)}
					</TableBody>
				</Table>
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
