"use client";

import TableBatchBar from "@/components/ui/data-table/table-batch-bar";
import TablePagination from "@/components/ui/data-table/table-pagination";
import {
	RowActionsRegistryProvider,
	useOptionalRowActionsRegistry,
	type RegisteredRowActions,
} from "@/components/ui/data-table/table-row-actions-context";
import {
	collectTextSearchTerms,
	highlightReactNode,
} from "@/components/ui/data-table/table-search-highlight";
import { createSelectColumn, SELECT_COLUMN_ID } from "@/components/ui/data-table/table-select-column";
import TableToolbar from "@/components/ui/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
	hasActiveFilters,
	type ColumnFilters as ListColumnFilters,
	type FacetOption,
	type ListQuery,
} from "@/lib/list-query";
import { cn } from "@/lib/utils";
import {
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	ColumnSizingState,
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
	type OnChangeFn,
	type Updater,
} from "@tanstack/react-table";
import { Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import {
	DEFAULT_COLUMN_SIZE,
	clearColumnLayout,
	defaultColumnPinning,
	getCommonPinningStyles,
	loadColumnLayout,
	mergeColumnOrder,
	moveColumn,
	saveColumnLayout,
} from "./data-table/column-layout";
import { DataTableUiProvider } from "./data-table/data-table-ui-context";

export type DataTableServerProps = {
	query: ListQuery;
	onQueryChange: (query: ListQuery) => void;
	total: number;
	facetOptions?: Record<string, FacetOption[]>;
	/** Debounce for text filters before hitting the server (ms). */
	filterDebounceMs?: number;
};

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filters: string[];
	facetedFilters?: string[];
	filterLabels?: Record<string, string>;
	className?: string;
	entityLabel?: string;
	/**
	 * Session-storage key for column order / size / pin.
	 * Falls back to `entityLabel` when omitted. No key → in-memory only.
	 */
	columnLayoutKey?: string;
	/** Next-action hint when the dataset is empty (not filter-empty). */
	emptyGuidance?: React.ReactNode;
	/** When set, enables manualPagination / controlled filters (DB-backed lists). */
	server?: DataTableServerProps;
	/**
	 * Multi-select + batch bar. Defaults to true so all migrated lists benefit.
	 * Set false only for atypical tables that should stay click-only.
	 */
	enableRowSelection?: boolean;
}

/** Injected pin column (ticket 19). */
const PIN_COLUMN_ID = "__pin";

/** Matches `TableHead` h-12 so pinned rows sit under the sticky header. */
const STICKY_HEADER_OFFSET = "3rem";
/** Approximate body row height (p-4 + line) for stacking multiple pinned rows. */
const STICKY_ROW_HEIGHT = "3.5rem";

function applyUpdater<T>(updater: Updater<T>, previous: T): T {
	return typeof updater === "function" ? (updater as (old: T) => T)(previous) : updater;
}

function listFiltersToColumnFilters(filters: ListColumnFilters): ColumnFiltersState {
	return Object.entries(filters).map(([id, filter]) => ({
		id,
		value: filter.kind === "text" ? filter.value : filter.values.map(String),
	}));
}

function columnFiltersToListFilters(
	columnFilters: ColumnFiltersState,
	textFilterIds: string[],
	facetedFilterIds: string[]
): ListColumnFilters {
	const next: ListColumnFilters = {};
	const textSet = new Set(textFilterIds);
	const facetedSet = new Set(facetedFilterIds);

	for (const filter of columnFilters) {
		const isArray = Array.isArray(filter.value);
		// Same column can appear in both text + faceted (e.g. entrances `product`):
		// array value → enum facet; string → text contains.
		if (facetedSet.has(filter.id) && isArray) {
			const values = (filter.value as unknown[]).map(String);
			if (values.length > 0) {
				next[filter.id] = { kind: "enum", values };
			}
			continue;
		}
		if (textSet.has(filter.id)) {
			const value = typeof filter.value === "string" ? filter.value : "";
			if (value.trim()) {
				next[filter.id] = { kind: "text", value };
			}
			continue;
		}
		if (facetedSet.has(filter.id)) {
			const values = filter.value != null ? [String(filter.value)] : [];
			if (values.length > 0) {
				next[filter.id] = { kind: "enum", values };
			}
		}
	}
	return next;
}

function leafColumnIdsFromDefs<TData, TValue>(columns: ColumnDef<TData, TValue>[]): string[] {
	const ids: string[] = [];
	const walk = (defs: ColumnDef<TData, TValue>[]) => {
		for (const def of defs) {
			if ("columns" in def && Array.isArray(def.columns)) {
				walk(def.columns as ColumnDef<TData, TValue>[]);
				continue;
			}
			const id =
				def.id ??
				("accessorKey" in def && def.accessorKey != null
					? String(def.accessorKey).replace(/\./g, "_")
					: undefined);
			if (id) ids.push(id);
		}
	};
	walk(columns);
	return ids;
}

function defaultGetRowId<TData>(row: TData, index: number): string {
	const record = row as { id?: string | number };
	if (record?.id != null) return String(record.id);
	return String(index);
}

function createPinColumn<TData>(): ColumnDef<TData, unknown> {
	return {
		id: PIN_COLUMN_ID,
		header: () => <span className="sr-only">Fissa</span>,
		cell: ({ row }) => <PinRowButton row={row} />,
		enableSorting: false,
		enableHiding: false,
		enableColumnFilter: false,
		enableResizing: false,
		size: 40,
	};
}

function PinRowButton<TData>({ row }: { row: Row<TData> }) {
	const pinned = row.getIsPinned();
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"h-8 w-8 text-muted-foreground hover:text-foreground",
				pinned && "text-primary hover:text-primary"
			)}
			aria-label={pinned ? "Sblocca riga" : "Fissa riga"}
			aria-pressed={Boolean(pinned)}
			onClick={(event) => {
				event.stopPropagation();
				row.pin(pinned ? false : "top");
			}}
		>
			{pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
		</Button>
	);
}

function DataTableRow<TData>({
	row,
	getRowActions,
	searchTerms,
	sticky,
}: {
	row: Row<TData>;
	getRowActions: (rowId: string) => RegisteredRowActions | undefined;
	searchTerms: string[];
	sticky?: boolean;
}) {
	const [menuActions, setMenuActions] = React.useState<RegisteredRowActions | undefined>();
	const pinned = row.getIsPinned();
	const stickyStyle =
		sticky && pinned === "top"
			? {
					position: "sticky" as const,
					top: `calc(${STICKY_HEADER_OFFSET} + ${row.getPinnedIndex()} * ${STICKY_ROW_HEIGHT})`,
					zIndex: 9,
				}
			: undefined;

	const renderCell = (cell: ReturnType<Row<TData>["getVisibleCells"]>[number]) => {
		const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
		if (
			cell.column.id === PIN_COLUMN_ID ||
			cell.column.id === SELECT_COLUMN_ID ||
			cell.column.id === "actions" ||
			searchTerms.length === 0
		) {
			return rendered;
		}
		return highlightReactNode(rendered, searchTerms);
	};

	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) setMenuActions(getRowActions(row.id));
			}}
		>
			<ContextMenuTrigger asChild>
				<TableRow
					data-state={row.getIsSelected() && "selected"}
					data-pinned={pinned || undefined}
					className={cn(
						"data-[state=selected]:bg-primary/10",
						pinned && "bg-muted/80 shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
					)}
					style={stickyStyle}
				>
					{row.getVisibleCells().map((cell) => (
						<TableCell
							key={cell.id}
							className={cn(
								"whitespace-nowrap",
								cell.column.id === PIN_COLUMN_ID && "w-10 px-2",
								pinned && "bg-muted/80"
							)}
							style={getCommonPinningStyles(cell.column)}
						>
							{renderCell(cell)}
						</TableCell>
					))}
				</TableRow>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuLabel className="text-xs font-normal text-muted-foreground">Azioni</ContextMenuLabel>
				<ContextMenuSeparator />
				{menuActions?.canEdit ? (
					<ContextMenuItem
						className="cursor-pointer gap-2"
						onSelect={() => {
							menuActions.openEdit();
						}}
					>
						<Pencil className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
						Modifica
					</ContextMenuItem>
				) : null}
				{menuActions?.canDelete ? (
					<ContextMenuItem
						className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
						onSelect={() => {
							menuActions.openDelete();
						}}
					>
						<Trash2 className="h-3.5 w-3.5" aria-hidden />
						Elimina
					</ContextMenuItem>
				) : null}
				{!menuActions?.canEdit && !menuActions?.canDelete ? (
					<ContextMenuItem disabled className="text-muted-foreground">
						Nessuna azione disponibile
					</ContextMenuItem>
				) : null}
			</ContextMenuContent>
		</ContextMenu>
	);
}

function DataTableInner<TData, TValue>({
	columns,
	data,
	filters,
	facetedFilters,
	filterLabels,
	className,
	entityLabel,
	columnLayoutKey,
	emptyGuidance,
	server,
	enableRowSelection = true,
}: DataTableProps<TData, TValue>) {
	const isServer = server != null;
	const layoutKey = columnLayoutKey ?? entityLabel ?? null;
	const leafIds = React.useMemo(() => leafColumnIdsFromDefs(columns), [columns]);
	const defaultPinning = React.useMemo(() => defaultColumnPinning(leafIds), [leafIds]);
	const rowActionsRegistry = useOptionalRowActionsRegistry();

	const [sorting, setSorting] = React.useState<SortingState>(() =>
		server?.query.sort ? [{ id: server.query.sort.id, desc: server.query.sort.desc }] : []
	);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() =>
		server ? listFiltersToColumnFilters(server.query.filters) : []
	);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
	const [pagination, setPagination] = React.useState<PaginationState>(() => ({
		pageIndex: server?.query.page ?? 0,
		pageSize: server?.query.pageSize ?? 10,
	}));

	const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() => {
		if (!layoutKey) return [];
		const saved = loadColumnLayout(layoutKey);
		return mergeColumnOrder(saved?.order ?? [], leafIds);
	});
	const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(() => {
		if (!layoutKey) return {};
		return loadColumnLayout(layoutKey)?.sizing ?? {};
	});
	const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() => {
		if (!layoutKey) return defaultPinning;
		const saved = loadColumnLayout(layoutKey);
		return saved?.pinning && (saved.pinning.left?.length || saved.pinning.right?.length)
			? saved.pinning
			: defaultPinning;
	});
	const [rowPinning, setRowPinning] = React.useState<RowPinningState>({
		top: [],
		bottom: [],
	});
	/** Keep pinned row payloads across server page changes so sticky compare still works. */
	const pinnedRowsCacheRef = React.useRef<Map<string, TData>>(new Map());

	const filterDebounceMs = server?.filterDebounceMs ?? 300;
	const textFilterTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const persistTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const skipFirstPersistRef = React.useRef(true);

	const tableColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
		let cols = columns as ColumnDef<TData, any>[];
		if (!cols.some((column) => column.id === PIN_COLUMN_ID)) {
			cols = [createPinColumn<TData>(), ...cols];
		}
		if (!enableRowSelection) return cols;
		if (cols.some((column) => column.id === SELECT_COLUMN_ID)) return cols;
		const pinIndex = cols.findIndex((column) => column.id === PIN_COLUMN_ID);
		const insertAt = pinIndex >= 0 ? pinIndex + 1 : 0;
		return [...cols.slice(0, insertAt), createSelectColumn<TData>(), ...cols.slice(insertAt)];
	}, [columns, enableRowSelection]);

	// Refresh cache entries for rows currently in `data`; drop unpinned ids.
	React.useEffect(() => {
		const pinnedIds = new Set([...(rowPinning.top ?? []), ...(rowPinning.bottom ?? [])]);
		for (const [id] of pinnedRowsCacheRef.current) {
			if (!pinnedIds.has(id)) pinnedRowsCacheRef.current.delete(id);
		}
		data.forEach((row, index) => {
			const id = defaultGetRowId(row, index);
			if (pinnedIds.has(id)) {
				pinnedRowsCacheRef.current.set(id, row);
			}
		});
	}, [data, rowPinning]);

	const tableData = React.useMemo(() => {
		const pinnedIds = [...(rowPinning.top ?? []), ...(rowPinning.bottom ?? [])];
		if (pinnedIds.length === 0) return data;

		const present = new Set(data.map((row, index) => defaultGetRowId(row, index)));
		const extras: TData[] = [];
		for (const id of pinnedIds) {
			if (present.has(id)) continue;
			const cached = pinnedRowsCacheRef.current.get(id);
			if (cached != null) extras.push(cached);
		}
		return extras.length > 0 ? [...extras, ...data] : data;
	}, [data, rowPinning]);

	// Sync page/sort from the server query. Column filters stay local so
	// debounced text input is not overwritten mid-typing by refetch results.
	React.useEffect(() => {
		if (!server) return;
		setSorting(server.query.sort ? [{ id: server.query.sort.id, desc: server.query.sort.desc }] : []);
		setPagination({
			pageIndex: server.query.page,
			pageSize: server.query.pageSize,
		});
	}, [server?.query.page, server?.query.pageSize, server?.query.sort?.id, server?.query.sort?.desc]);

	React.useEffect(() => {
		setColumnOrder((prev) => mergeColumnOrder(prev, leafIds));
		setColumnPinning((prev) => {
			if (prev.left?.length || prev.right?.length) {
				const known = new Set(leafIds);
				return {
					left: prev.left?.filter((id) => known.has(id)),
					right: prev.right?.filter((id) => known.has(id)),
				};
			}
			return defaultColumnPinning(leafIds);
		});
	}, [leafIds]);

	const isServerMode = server != null;
	const serverPage = server?.query.page;
	const serverPageSize = server?.query.pageSize;
	const serverSortId = server?.query.sort?.id;
	const serverSortDesc = server?.query.sort?.desc;
	const serverFiltersKey = server ? JSON.stringify(server.query.filters) : "";

	// Server-mode: clear selection when the query window changes so multi-select
	// stays scoped to the visible page result set (ticket 10 contract).
	// Depend on primitive/serialized query fields only — `server` is a new object each render.
	React.useEffect(() => {
		if (!isServerMode || !enableRowSelection) return;
		setRowSelection({});
	}, [
		isServerMode,
		serverPage,
		serverPageSize,
		serverSortId,
		serverSortDesc,
		serverFiltersKey,
		enableRowSelection,
	]);

	React.useEffect(() => {
		return () => {
			if (textFilterTimerRef.current) clearTimeout(textFilterTimerRef.current);
			if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
		};
	}, []);

	React.useEffect(() => {
		if (!layoutKey) return;
		if (skipFirstPersistRef.current) {
			skipFirstPersistRef.current = false;
			return;
		}
		if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
		persistTimerRef.current = setTimeout(() => {
			saveColumnLayout(layoutKey, {
				order: columnOrder,
				sizing: columnSizing,
				pinning: columnPinning,
			});
		}, 200);
	}, [layoutKey, columnOrder, columnSizing, columnPinning]);

	const emitServerQuery = React.useCallback(
		(patch: Partial<ListQuery>) => {
			if (!server) return;
			server.onQueryChange({
				...server.query,
				...patch,
			});
		},
		[server]
	);

	const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
		(updater) => {
			const next = applyUpdater(updater, sorting);
			setSorting(next);
			if (!server) return;
			const first = next[0];
			emitServerQuery({
				page: 0,
				sort: first ? { id: first.id, desc: first.desc } : undefined,
			});
		},
		[emitServerQuery, server, sorting]
	);

	const onPaginationChange: OnChangeFn<PaginationState> = React.useCallback(
		(updater) => {
			const next = applyUpdater(updater, pagination);
			setPagination(next);
			if (!server) return;
			emitServerQuery({
				page: next.pageIndex,
				pageSize: next.pageSize,
			});
		},
		[emitServerQuery, pagination, server]
	);

	const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = React.useCallback(
		(updater) => {
			const next = applyUpdater(updater, columnFilters);
			setColumnFilters(next);
			if (!server) return;

			const listFilters = columnFiltersToListFilters(next, filters, facetedFilters ?? []);
			const prevList = server.query.filters;

			const textChanged = filters.some((id) => {
				const a = listFilters[id];
				const b = prevList[id];
				const aVal = a?.kind === "text" ? a.value : "";
				const bVal = b?.kind === "text" ? b.value : "";
				return aVal !== bVal;
			});
			const facetedChanged = (facetedFilters ?? []).some((id) => {
				const a = listFilters[id];
				const b = prevList[id];
				return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
			});

			if (textFilterTimerRef.current) {
				clearTimeout(textFilterTimerRef.current);
				textFilterTimerRef.current = null;
			}

			const push = () =>
				emitServerQuery({
					page: 0,
					filters: listFilters,
				});

			// Debounce only pure text edits; faceted/reset apply immediately.
			if (textChanged && !facetedChanged) {
				textFilterTimerRef.current = setTimeout(push, filterDebounceMs);
				return;
			}
			push();
		},
		[columnFilters, emitServerQuery, facetedFilters, filterDebounceMs, filters, server]
	);

	const pageCount = isServer
		? Math.max(1, Math.ceil(server.total / Math.max(server.query.pageSize, 1)))
		: undefined;

	const table = useReactTable<TData>({
		data: tableData,
		columns: tableColumns,
		defaultColumn: DEFAULT_COLUMN_SIZE,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		enableColumnPinning: true,
		enableRowPinning: true,
		keepPinnedRows: true,
		getRowId: (originalRow, index) => defaultGetRowId(originalRow, index),
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection,
		onRowSelectionChange: setRowSelection,
		...(isServer
			? {
					manualPagination: true,
					manualFiltering: true,
					manualSorting: true,
					pageCount,
					onPaginationChange,
				}
			: {
					getPaginationRowModel: getPaginationRowModel(),
					getSortedRowModel: getSortedRowModel(),
					getFilteredRowModel: getFilteredRowModel(),
					getFacetedRowModel: getFacetedRowModel(),
					getFacetedUniqueValues: getFacetedUniqueValues(),
				}),
		onSortingChange,
		onColumnFiltersChange,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		onColumnSizingChange: setColumnSizing,
		onColumnPinningChange: setColumnPinning,
		onRowPinningChange: setRowPinning,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			columnOrder,
			columnSizing,
			columnPinning,
			rowPinning,
			rowSelection,
			...(isServer ? { pagination } : {}),
		},
	});

	const tableRef = React.useRef(table);
	tableRef.current = table;

	const tableUi = React.useMemo(
		() => ({
			moveColumn: (columnId: string, direction: -1 | 1) => {
				moveColumn(tableRef.current, columnId, direction);
			},
			resetColumnLayout: () => {
				const nextPinning = defaultColumnPinning(leafIds);
				setColumnOrder(leafIds);
				setColumnSizing({});
				setColumnPinning(nextPinning);
				if (layoutKey) {
					clearColumnLayout(layoutKey);
					saveColumnLayout(layoutKey, {
						order: leafIds,
						sizing: {},
						pinning: nextPinning,
					});
				}
			},
		}),
		[leafIds, layoutKey]
	);

	const getRowActions = React.useCallback(
		(rowId: string) => rowActionsRegistry?.get(rowId),
		[rowActionsRegistry]
	);

	const isFiltered = isServer
		? hasActiveFilters(server.query.filters) || columnFilters.length > 0
		: columnFilters.length > 0;
	const searchTerms = React.useMemo(
		() => collectTextSearchTerms(columnFilters, filters),
		[columnFilters, filters]
	);
	const topRows = table.getTopRows();
	const centerRows = table.getCenterRows();
	const hasRows = topRows.length + centerRows.length > 0;
	const isDatasetEmpty = isServer ? server.total === 0 && !hasActiveFilters(server.query.filters) : data.length === 0;
	const emptyMessage = isDatasetEmpty
		? entityLabel
			? `Nessun ${entityLabel} registrato.`
			: "Nessun dato disponibile."
		: isFiltered
			? "Nessun risultato per i filtri attivi."
			: "Nessun risultato.";
	const emptyHint = isDatasetEmpty
		? emptyGuidance ??
			(entityLabel
				? `Usa le azioni in alto per registrare il primo ${entityLabel}.`
				: "Usa le azioni in alto per aggiungere il primo record, se disponibile.")
		: isFiltered
			? "I dati ci sono: modifica o azzera i filtri per vedere le righe."
			: null;

	const columnCount = table.getVisibleLeafColumns().length;

	return (
		<DataTableUiProvider value={tableUi}>
			<div className="flex h-full min-h-0 min-w-0 flex-col">
				<TableToolbar
					table={table}
					filters={filters}
					facetedFilters={facetedFilters}
					filterLabels={filterLabels}
					facetOptions={server?.facetOptions}
				/>
				{enableRowSelection ? (
					<TableBatchBar table={table} getRowActions={getRowActions} entityLabel={entityLabel} />
				) : null}
				<div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-md border contain-paint">
					<Table
						className={cn("w-max min-w-full table-fixed", className)}
						style={{ width: table.getTotalSize() }}
					>
						<TableHeader className="sticky top-0 z-20 bg-background [&_tr]:border-b [&_tr]:border-border">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="border-b bg-muted/50 hover:bg-muted/50">
									{headerGroup.headers.map((header) => {
										const pinningStyles = getCommonPinningStyles(header.column, {
											isHeader: true,
										});
										return (
											<TableHead
												key={header.id}
												className={cn(
													"relative whitespace-nowrap text-foreground",
													header.column.id === PIN_COLUMN_ID && "w-10 px-2"
												)}
												style={pinningStyles}
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
												{header.column.getCanResize() ? (
													<div
														role="separator"
														aria-orientation="vertical"
														aria-label={`Ridimensiona colonna ${header.column.id}`}
														onMouseDown={header.getResizeHandler()}
														onTouchStart={header.getResizeHandler()}
														onDoubleClick={() => header.column.resetSize()}
														className={cn(
															"absolute top-0 right-0 z-40 h-full w-1 cursor-col-resize touch-none select-none",
															"bg-border/0 hover:bg-border",
															header.column.getIsResizing() && "bg-primary"
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
							{hasRows ? (
								<>
									{topRows.map((row) => (
										<DataTableRow
											key={row.id}
											row={row}
											getRowActions={getRowActions}
											searchTerms={searchTerms}
											sticky
										/>
									))}
									{centerRows.map((row) => (
										<DataTableRow
											key={row.id}
											row={row}
											getRowActions={getRowActions}
											searchTerms={searchTerms}
										/>
									))}
								</>
							) : (
								<TableRow>
									<TableCell colSpan={Math.max(columnCount, 1)} className="h-28 px-6 text-center">
										<div className="mx-auto flex max-w-md flex-col items-center gap-1">
											<p className="text-sm font-medium text-foreground text-balance">{emptyMessage}</p>
											{emptyHint ? (
												<p className="text-sm text-muted-foreground text-pretty">{emptyHint}</p>
											) : null}
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<TablePagination table={table} />
			</div>
		</DataTableUiProvider>
	);
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
	return (
		<RowActionsRegistryProvider>
			<DataTableInner {...props} />
		</RowActionsRegistryProvider>
	);
}
