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
import TableToolbar from "@/components/ui/data-table/table-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ListFilters } from "@/lib/list";
import {
	ColumnDef,
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	Row,
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
	onDraftFilterChange: (key: string, value: string | undefined) => void;
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
	facetedFilters?: string[];
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

function DataTableRow<TData>({ row }: { row: Row<TData> }) {
	const registry = useRowActionsRegistry();
	const [menuActions, setMenuActions] = React.useState<
		ReturnType<typeof registry.get>
	>(undefined);

	const cells = row.getVisibleCells().map((cell) => (
		<TableCell key={cell.id}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	));

	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) setMenuActions(registry.get(row.id));
				else setMenuActions(undefined);
			}}
		>
			<ContextMenuTrigger asChild>
				<TableRow data-state={row.getIsSelected() && "selected"}>{cells}</TableRow>
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
				{!menuActions?.canEdit &&
				!menuActions?.canDelete &&
				!(menuActions?.extraActions?.length ?? 0) ? (
					<ContextMenuItem disabled>Nessuna azione</ContextMenuItem>
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
	emptyState,
	filteredEmptyState,
	isLoading = false,
	error = null,
	onRetry,
	className,
	serverList,
	getRowId,
	entityLabel = "record",
	bulkDeleteRow,
	bulkActions,
	onBulkComplete,
}: DataTableProps<TData, TValue>) {
	const isServer = !!serverList?.manual;
	const filtersActive = hasAppliedFilters(serverList?.appliedFilters);
	const enableSelection = !!bulkDeleteRow || (bulkActions?.length ?? 0) > 0;

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const selectColumn = React.useMemo<ColumnDef<TData, TValue>>(
		() => ({
			id: "__select",
			enableSorting: false,
			enableHiding: false,
			header: ({ table }) => (
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
			),
			cell: ({ row }) => (
				<Checkbox
					aria-label="Seleziona riga"
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					onClick={(event) => event.stopPropagation()}
				/>
			),
			size: 40,
		}),
		[]
	);

	const tableColumns = React.useMemo(
		() => (enableSelection ? [selectColumn, ...columns] : columns),
		[enableSelection, selectColumn, columns]
	);

	const table = useReactTable({
		data,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
		enableRowSelection: enableSelection,
		onRowSelectionChange: setRowSelection,
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
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting: isServer ? serverList.sorting : sorting,
			columnFilters: isServer ? [] : columnFilters,
			columnVisibility,
			pagination: isServer ? serverList.pagination : pagination,
			rowSelection,
		},
	});

	const pageIndex = isServer ? serverList.pagination.pageIndex : pagination.pageIndex;
	const pageSize = isServer ? serverList.pagination.pageSize : pagination.pageSize;
	const dataIdentity = React.useMemo(
		() => data.map((_, i) => (getRowId ? getRowId(data[i], i) : String(i))).join("|"),
		[data, getRowId]
	);

	React.useEffect(() => {
		setRowSelection({});
	}, [pageIndex, pageSize, dataIdentity]);

	const rows = table.getRowModel().rows;
	const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
	const colSpan = tableColumns.length;
	const showLoading = isLoading && rows.length === 0 && !error;
	const showError = !!error;
	const showEmpty = !showLoading && !showError && rows.length === 0;

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
		<div
			className="flex h-full min-h-0 min-w-0 flex-col"
			aria-busy={isLoading || undefined}
		>
			<TableToolbar
				table={table}
				filters={filters}
				facetedFilters={isServer ? undefined : facetedFilters}
				filterLabels={filterLabels}
				serverList={
					isServer
						? {
								draftFilters: serverList.draftFilters,
								onDraftFilterChange: serverList.onDraftFilterChange,
								onApplyFilters: serverList.onApplyFilters,
								onResetFilters: serverList.onResetFilters,
								filtersDirty: serverList.filtersDirty,
							}
						: undefined
				}
			/>
			{enableSelection ? (
				<TableBulkBar
					selectedRows={selectedRows}
					entityLabel={entityLabel}
					bulkDeleteRow={bulkDeleteRow}
					bulkActions={bulkActions}
					onComplete={() => onBulkComplete?.()}
					onClearSelection={() => setRowSelection({})}
				/>
			) : null}
			<div className="min-h-0 min-w-0 flex-1 overflow-auto contain-paint rounded-md border">
				<Table className={className}>
					<TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-0 [&_tr]:shadow-[inset_0_-1px_0] [&_tr]:shadow-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="bg-opacity-25 bg-stone-600">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
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
							rows.map((row) => <DataTableRow key={row.id} row={row} />)
						)}
					</TableBody>
				</Table>
			</div>
			<TablePagination table={table} />
		</div>
	);
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
	return (
		<RowActionsProvider>
			<DataTableInner {...props} />
		</RowActionsProvider>
	);
}
