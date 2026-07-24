"use client";

import { Button } from "@/components/ui/button";
import {
	ListShellError,
	ListShellLoading,
} from "@/components/ui/data-table/list-shell-status";
import { ServerListPagination } from "@/components/ui/data-table/server-list-pagination";
import { ServerListToolbar } from "@/components/ui/data-table/server-list-toolbar";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
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
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	useReactTable,
	type OnChangeFn,
} from "@tanstack/react-table";
import * as React from "react";

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
};

/**
 * Entity table driven by server-side list query (ticket 20+).
 * Manual filter/sort/pagination — no client row models for those concerns.
 * Loading / error / empty states live in this shared shell (ticket 39).
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
}: ServerDataTableProps<TData, TValue>) {
	const sorting = React.useMemo(
		() => tanstackSortingFromListSort(sort) as SortingState,
		[sort]
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});

	const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
		(updater) => {
			const next =
				typeof updater === "function" ? updater(sorting) : updater;
			onSortChange(listSortFromTanstack(next));
		},
		[onSortChange, sorting]
	);

	const table = useReactTable({
		data,
		columns,
		...SERVER_TABLE_MANUAL_FLAGS,
		rowCount: total,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange,
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnVisibility,
			pagination: {
				pageIndex: Math.max(0, page - 1),
				pageSize,
			},
		},
	});

	const showInitialLoading = listStatus === "loading" && data.length === 0;
	const showError = listStatus === "error" && data.length === 0;
	const showRefreshing = listStatus === "loading" && data.length > 0;
	const showErrorBanner = listStatus === "error" && data.length > 0;

	return (
		<div className="flex h-full flex-col">
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
			<div
				className="flex-1 overflow-auto rounded-md border"
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
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
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
