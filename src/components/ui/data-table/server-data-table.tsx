"use client";

import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	ListShellError,
	ListShellLoading,
} from "@/components/ui/data-table/list-shell-status";
import {
	RowActionsProvider,
	type RowActionHandlers,
} from "@/components/ui/data-table/row-actions-context";
import { ServerListPagination } from "@/components/ui/data-table/server-list-pagination";
import { ServerListToolbar } from "@/components/ui/data-table/server-list-toolbar";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { TableBulkBar } from "@/components/ui/data-table/table-bulk-bar";
import { createSelectColumn } from "@/components/ui/data-table/table-select-column";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EntityListStatus } from "@/hooks/useEntityListFetch";
import {
	SERVER_TABLE_MANUAL_FLAGS,
	listSortFromTanstack,
	tanstackSortingFromListSort,
	type ListEmptyKind,
	type ListSort,
} from "@/lib/domain/list-query";
import {
	DATASET_EMPTY_MESSAGES,
	tableEmptyMessage,
} from "@/lib/format/table-empty";
import {
	ColumnDef,
	Row,
	RowSelectionState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	useReactTable,
	type OnChangeFn,
} from "@tanstack/react-table";
import * as React from "react";

export type ServerDataTableBulkConfig<TData> = {
	entityLabel: string;
	deleteConsequence?: string;
	/** Delete a single selected row (no list refresh — table calls onDeleted once). */
	deleteRow: (row: TData) => Promise<void>;
	onDeleted?: () => void | Promise<void>;
};

export type ServerDataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
	sort: ListSort | null;
	onSortChange: (sort: ListSort | null) => void;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	filterFields: readonly ServerListFilterField[];
	draftFilters: Record<string, string>;
	onDraftFilterChange: (id: string, value: string) => void;
	onApplyFilters: () => void;
	onResetFilters: () => void;
	isFilterDirty?: boolean;
	hasAppliedFilters?: boolean;
	emptyKind?: ListEmptyKind | null;
	/** Empty copy when the unfiltered dataset has no rows. */
	datasetEmptyMessage?: string;
	/** Shared list fetch lifecycle (ticket 39). */
	listStatus?: EntityListStatus;
	listError?: string | null;
	onRetry?: () => void;
	className?: string;
	/** Stable row id for selection (required for multi-select). */
	getRowId?: (originalRow: TData, index: number) => string;
	/** Enables checkbox column + bulk Elimina bar. */
	bulk?: ServerDataTableBulkConfig<TData>;
	/**
	 * Extra bulk actions (e.g. Approva) when rows are selected.
	 * Rendered inside the bulk bar beside Elimina.
	 */
	bulkExtraActions?: (ctx: {
		selectedRows: TData[];
		clearSelection: () => void;
	}) => React.ReactNode;
};

function DataTableContextMenuRow<TData>({
	row,
	children,
}: {
	row: Row<TData>;
	children: React.ReactNode;
}) {
	const [handlers, setHandlers] = React.useState<RowActionHandlers | null>(
		null
	);
	const hasActions =
		Boolean(handlers?.canEdit && handlers.openEdit) ||
		Boolean(handlers?.canDelete && handlers.openDelete);

	return (
		<RowActionsProvider onHandlersChange={setHandlers}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<TableRow data-state={row.getIsSelected() && "selected"}>
						{children}
					</TableRow>
				</ContextMenuTrigger>
				{hasActions ? (
					<ContextMenuContent>
						<ContextMenuLabel>Azioni</ContextMenuLabel>
						<ContextMenuSeparator />
						{handlers?.canEdit && handlers.openEdit ? (
							<ContextMenuItem onSelect={() => handlers.openEdit?.()}>
								Modifica
							</ContextMenuItem>
						) : null}
						{handlers?.canDelete && handlers.openDelete ? (
							<ContextMenuItem onSelect={() => handlers.openDelete?.()}>
								Elimina
							</ContextMenuItem>
						) : null}
					</ContextMenuContent>
				) : null}
			</ContextMenu>
		</RowActionsProvider>
	);
}

/**
 * Entity table driven by server-side list query (ticket 20+).
 * Manual filter/sort/pagination — no client row models for those concerns.
 * Loading / error / empty states live in this shared shell (ticket 39).
 * Context menu + multi-select bulk (ticket 42).
 */
export function ServerDataTable<TData, TValue>({
	columns,
	data,
	total,
	page,
	pageSize,
	pageCount,
	sort,
	onSortChange,
	onPageChange,
	onPageSizeChange,
	filterFields,
	draftFilters,
	onDraftFilterChange,
	onApplyFilters,
	onResetFilters,
	isFilterDirty = false,
	hasAppliedFilters = false,
	emptyKind = null,
	datasetEmptyMessage = DATASET_EMPTY_MESSAGES.clienti,
	listStatus = "success",
	listError = null,
	onRetry,
	className,
	getRowId,
	bulk,
	bulkExtraActions,
}: ServerDataTableProps<TData, TValue>) {
	const sorting = React.useMemo(
		() => tanstackSortingFromListSort(sort) as SortingState,
		[sort]
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
		{}
	);

	const enableSelection = Boolean(bulk);

	const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
		(updater) => {
			const next =
				typeof updater === "function" ? updater(sorting) : updater;
			onSortChange(listSortFromTanstack(next));
		},
		[onSortChange, sorting]
	);

	React.useEffect(() => {
		setRowSelection({});
	}, [page, pageSize, sort]);

	const tableColumns = React.useMemo(() => {
		if (!enableSelection) return columns;
		return [createSelectColumn<TData>(), ...columns] as ColumnDef<
			TData,
			TValue
		>[];
	}, [columns, enableSelection]);

	const table = useReactTable({
		data,
		columns: tableColumns,
		...SERVER_TABLE_MANUAL_FLAGS,
		rowCount: total,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		enableRowSelection: enableSelection,
		getRowId: getRowId
			? (originalRow, index) => getRowId(originalRow, index)
			: undefined,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			pagination: {
				pageIndex: Math.max(0, page - 1),
				pageSize,
			},
		},
	});

	const selectedRows = table
		.getSelectedRowModel()
		.rows.map((r) => r.original);

	const clearSelection = React.useCallback(() => {
		setRowSelection({});
	}, []);

	const showInitialLoading = listStatus === "loading" && data.length === 0;
	const showError = listStatus === "error" && data.length === 0;
	const showRefreshing = listStatus === "loading" && data.length > 0;
	const showErrorBanner = listStatus === "error" && data.length > 0;

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<ServerListToolbar
				fields={filterFields}
				draftValues={draftFilters}
				onDraftChange={onDraftFilterChange}
				onApply={onApplyFilters}
				onReset={onResetFilters}
				isDirty={isFilterDirty}
				hasApplied={hasAppliedFilters}
			/>
			{showErrorBanner && onRetry ? (
				<div
					role="alert"
					className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
				>
					<span className="text-foreground">
						{listError ?? "Impossibile aggiornare l'elenco."}
					</span>
					<Button type="button" variant="outline" size="sm" onClick={onRetry}>
						Riprova
					</Button>
				</div>
			) : null}
			{bulk ? (
				<TableBulkBar
					selectedRows={selectedRows}
					entityLabel={bulk.entityLabel}
					deleteConsequence={bulk.deleteConsequence}
					deleteRow={bulk.deleteRow}
					onDeleted={bulk.onDeleted}
					onClearSelection={clearSelection}
					extraActions={bulkExtraActions?.({
						selectedRows,
						clearSelection,
					})}
				/>
			) : null}
			<div
				className="min-h-0 min-w-0 flex-1 overflow-auto contain-paint rounded-md border"
				aria-busy={listStatus === "loading" || undefined}
			>
				{showError && onRetry ? (
					<ListShellError message={listError} onRetry={onRetry} />
				) : showInitialLoading ? (
					<ListShellLoading />
				) : (
					<Table
						className={
							showRefreshing
								? `${className ?? ""} opacity-70 transition-opacity`.trim()
								: className
						}
					>
						<TableHeader className="sticky top-0 z-10 bg-background [&_tr]:border-0 [&_tr]:shadow-[inset_0_-1px_0] [&_tr]:shadow-border">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow
									key={headerGroup.id}
									className="bg-opacity-25 bg-stone-600"
								>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<DataTableContextMenuRow key={row.id} row={row}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</DataTableContextMenuRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={tableColumns.length}
										className="h-24 text-center"
									>
										<span className="text-muted-foreground">
											{tableEmptyMessage(emptyKind, datasetEmptyMessage)}
										</span>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				)}
			</div>
			<ServerListPagination
				page={page}
				pageSize={pageSize}
				pageCount={pageCount}
				total={total}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
			/>
		</div>
	);
}
