import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { TableFacetedFilter } from "./table-faceted-filter";

interface TableToolbarProps<TData> {
	table: Table<TData>;
	filters: Array<Extract<keyof TData, string>>;
	facetedFilters?: Array<Extract<keyof TData, string>>;
}

export default function TableToolbar<TData>({ table, filters, facetedFilters }: TableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between pb-4">
			<div className="flex items-center gap-4">
				{filters.map((filter, _) => (
					<Input
						key={_}
						placeholder={`Filter ${filter}s...`}
						value={(table.getColumn(filter)?.getFilterValue() as string) ?? ""}
						onChange={(event) => table.getColumn(filter)?.setFilterValue(event.target.value)}
						className="max-w-sm w-auto"
					/>
				))}
				{facetedFilters &&
					facetedFilters.map((filter, _) => (
						<TableFacetedFilter
							key={_}
							column={table.getColumn(filter)}
							title={filter.charAt(0).toUpperCase() + filter.slice(1)}
							options={Array.from(new Set(table.getCoreRowModel().flatRows.map((row) => row.getValue(filter)))).map(
								(value) => ({
									value: value as string,
									label: String(value),
								})
							)}
						/>
					))}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-10 px-2 lg:px-3"
					>
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="ml-auto"
					>
						Columns
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{table
						.getAllColumns()
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
