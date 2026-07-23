import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { FacetOption } from "@/lib/list-query";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { TableFacetedFilter } from "./table-faceted-filter";

interface TableToolbarProps<TData> {
	table: Table<TData>;
	filters: string[];
	facetedFilters?: string[];
	filterLabels?: Record<string, string>;
	/** When provided (server mode), facet options come from the API instead of loaded rows. */
	facetOptions?: Record<string, FacetOption[]>;
}

function humanizeKey(key: string): string {
	return key
		.replace(/([A-Z])/g, (match, p1, offset) =>
			offset > 0 && key.charAt(offset - 1) !== " " ? ` ${p1}` : p1
		)
		.replace(/\bId\b/g, "ID")
		.trim()
		.replace(/^./, (str) => str.toUpperCase());
}

export default function TableToolbar<TData>({
	table,
	filters,
	facetedFilters,
	filterLabels,
	facetOptions
}: TableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;
	const labelFor = (key: string) => filterLabels?.[key] ?? humanizeKey(key);
	const useServerFacets = facetOptions != null;

	return (
		<div className="flex min-w-0 flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
				{filters.map((filter) => (
					<Input
						key={filter}
						placeholder={labelFor(filter)}
						value={(table.getColumn(filter)?.getFilterValue() as string) ?? ""}
						onChange={(event) => table.getColumn(filter)?.setFilterValue(event.target.value)}
						className="h-9 w-full min-w-[9rem] max-w-xs sm:w-auto"
						aria-label={`Filtra per ${labelFor(filter)}`}
					/>
				))}
				{facetedFilters?.map((filter) => {
					const serverOptions = facetOptions?.[filter];
					const options = useServerFacets
						? (serverOptions ?? []).map((option) => ({
								value: option.value,
								label: option.value,
								count: option.count,
							}))
						: Array.from(
								new Set(table.getCoreRowModel().flatRows.map((row) => row.getValue(filter)))
							).map((value) => ({
								value: String(value),
								label: String(value),
							}));

					return (
						<TableFacetedFilter
							key={filter}
							column={table.getColumn(filter)}
							title={labelFor(filter)}
							options={options}
							useColumnFacets={!useServerFacets}
						/>
					);
				})}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-9 px-2 lg:px-3"
					>
						Azzera
						<X className="size-4" aria-hidden />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="h-9 shrink-0 self-end sm:self-auto">
						Colonne
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{table
						.getAllColumns()
						.filter((column) => column.id !== "actions" && column.id !== "__pin")
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{labelFor(column.id)}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
