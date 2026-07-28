import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { columnLabel } from "@/lib/domain/column-labels";
import type { ListFilters } from "@/lib/list";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { TableFacetedFilter } from "./table-faceted-filter";

export type TableToolbarServerListProps = {
	draftFilters: ListFilters;
	onDraftFilterChange: (key: string, value: string | undefined) => void;
	onApplyFilters: () => void;
	onResetFilters: () => void;
	filtersDirty?: boolean;
};

interface TableToolbarProps<TData> {
	table: Table<TData>;
	/** Chiavi filtro (accessor / id colonna / chiave server-list). */
	filters: string[];
	facetedFilters?: string[];
	/** Override placeholder per chiave filtro (es. purchaseId → "ID Acquisto"). */
	filterLabels?: Record<string, string>;
	/** Se presente: draft + Conferma/Filtra (niente query a ogni keystroke). */
	serverList?: TableToolbarServerListProps;
}

function filterPlaceholder(filter: string, labels?: Record<string, string>): string {
	const labeled = labels?.[filter];
	if (labeled) return labeled;
	return columnLabel(filter);
}

export default function TableToolbar<TData>({
	table,
	filters,
	facetedFilters,
	filterLabels,
	serverList,
}: TableToolbarProps<TData>) {
	const isServer = !!serverList;
	const isFiltered = isServer
		? Object.keys(serverList.draftFilters).length > 0 ||
			(serverList.filtersDirty ?? false)
		: table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between pb-4">
			<div className="flex items-center gap-4 flex-wrap">
				{filters.map((filter) => (
					<Input
						key={filter}
						placeholder={filterPlaceholder(filter, filterLabels)}
						value={
							isServer
								? String(serverList.draftFilters[filter] ?? "")
								: ((table.getColumn(filter)?.getFilterValue() as string) ?? "")
						}
						onChange={(event) => {
							const value = event.target.value;
							if (isServer) {
								serverList.onDraftFilterChange(filter, value || undefined);
								return;
							}
							table.getColumn(filter)?.setFilterValue(value);
						}}
						onKeyDown={
							isServer
								? (event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											serverList.onApplyFilters();
										}
									}
								: undefined
						}
						className="max-w-sm w-auto"
					/>
				))}
				{!isServer &&
					facetedFilters &&
					facetedFilters.map((filter) => (
						<TableFacetedFilter
							key={filter}
							column={table.getColumn(filter)}
							title={columnLabel(filter)}
							options={Array.from(
								new Set(table.getCoreRowModel().flatRows.map((row) => row.getValue(filter)))
							).map((value) => ({
								value: value as string,
								label: String(value),
							}))}
						/>
					))}
				{isServer && (
					<Button
						type="button"
						variant="default"
						onClick={() => serverList.onApplyFilters()}
						className="h-10"
					>
						Filtra
					</Button>
				)}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => {
							if (isServer) {
								serverList.onResetFilters();
								return;
							}
							table.resetColumnFilters();
						}}
						className="h-10 px-2 lg:px-3"
					>
						Reimposta
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="ml-auto">
						Colonne
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{table
						.getAllColumns()
						.filter((column) => column.id !== "actions")
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{columnLabel(column.id)}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
