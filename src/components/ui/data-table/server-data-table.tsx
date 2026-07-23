"use client";

import { ServerListPagination } from "@/components/ui/data-table/server-list-pagination";
import { ServerListToolbar } from "@/components/ui/data-table/server-list-toolbar";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
	SERVER_TABLE_MANUAL_FLAGS,
	listSortFromTanstack,
	tanstackSortingFromListSort,
	type ListEmptyKind,
	type ListSort,
} from "@/lib/domain/list-query";
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
	className?: string;
};

function emptyMessage(kind: ListEmptyKind | null | undefined): string {
	if (kind === "filters") return "Nessun risultato per i filtri applicati.";
	if (kind === "dataset") return "Nessun cliente in anagrafica.";
	return "Nessun risultato.";
}

/**
 * Entity table driven by server-side list query (ticket 20+).
 * Manual filter/sort/pagination — no client row models for those concerns.
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

	return (
		<div className="flex flex-col h-full">
			<ServerListToolbar
				fields={filterFields}
				draftValues={draftFilters}
				onDraftChange={onDraftFilterChange}
				onApply={onApplyFilters}
				onReset={onResetFilters}
				isDirty={isFilterDirty}
				hasApplied={hasAppliedFilters}
			/>
			<div className="rounded-md border overflow-auto flex-1">
				<Table className={className}>
					<TableHeader className="sticky top-0 bg-background z-10 [&_tr]:border-0 [&_tr]:shadow-[inset_0_-1px_0] [&_tr]:shadow-border">
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
									{emptyMessage(emptyKind)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
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
