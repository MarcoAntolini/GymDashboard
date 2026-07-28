"use client";

import TablePagination from "@/components/ui/data-table/table-pagination";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import TableToolbar from "@/components/ui/data-table/table-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ListFilters } from "@/lib/list";
import {
	ColumnDef,
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
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
};

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Chiavi filtro toolbar (native o join mappati lato server). */
	filters: string[];
	facetedFilters?: string[];
	/** Override placeholder per chiave filtro. */
	filterLabels?: Record<string, string>;
	/** Empty state dominio (default IT generico). Distinzione filtri vs dataset → ticket 39. */
	emptyState?: React.ReactNode;
	className?: string;
	serverList?: DataTableServerListProps;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filters,
	facetedFilters,
	filterLabels,
	emptyState,
	className,
	serverList,
}: DataTableProps<TData, TValue>) {
	const isServer = !!serverList?.manual;

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
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
		},
	});

	return (
		<div className="flex flex-col h-full">
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
			<div className="rounded-md border overflow-auto flex-1">
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
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									{emptyState ?? (
										<TableEmptyState
											title="Nessun risultato"
											hint="Prova a modificare i filtri o registra un nuovo elemento."
										/>
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<TablePagination table={table} />
		</div>
	);
}
