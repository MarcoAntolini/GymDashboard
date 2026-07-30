import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { columnLabel } from "@/lib/domain/column-labels";
import type { ListFacetedFilter, ListFilters } from "@/lib/list";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import {
	TableFacetedFilter,
} from "./table-faceted-filter";

export type DataTableFacetedFilter = ListFacetedFilter;

export type TableToolbarServerListProps = {
	draftFilters: ListFilters;
	onDraftFilterChange: (key: string, value: string | string[] | undefined) => void;
	onApplyFilters: () => void;
	onResetFilters: () => void;
	filtersDirty?: boolean;
};

interface TableToolbarProps<TData> {
	table: Table<TData>;
	/** Chiavi filtro testo (accessor / id colonna / chiave server-list). */
	filters: string[];
	/** Filtri a valori chiusi (enum/boolean) — multi-select. */
	facetedFilters?: ListFacetedFilter[];
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

function draftFacetValue(raw: ListFilters[string]): string[] {
	if (typeof raw === "string" && raw) return [raw];
	if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
	if (typeof raw === "boolean") return [String(raw)];
	return [];
}

export default function TableToolbar<TData>({
	table,
	filters,
	facetedFilters,
	filterLabels,
	serverList,
}: TableToolbarProps<TData>) {
	const isServer = !!serverList;
	const facetedKeys = new Set(facetedFilters?.map((f) => f.key) ?? []);
	const textFilters = filters.filter((key) => !facetedKeys.has(key));
	const isFiltered = isServer
		? Object.keys(serverList.draftFilters).length > 0 ||
			(serverList.filtersDirty ?? false)
		: table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between pb-4">
			<div className="flex items-center gap-4 flex-wrap">
				{textFilters.map((filter) => (
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
				{facetedFilters?.map((filter) => {
					const title =
						filter.title ??
						filterLabels?.[filter.key] ??
						columnLabel(filter.key);
					if (isServer) {
						return (
							<TableFacetedFilter
								key={filter.key}
								title={title}
								options={filter.options}
								value={draftFacetValue(serverList.draftFilters[filter.key])}
								onValueChange={(next) =>
									serverList.onDraftFilterChange(filter.key, next)
								}
							/>
						);
					}
					return (
						<TableFacetedFilter
							key={filter.key}
							column={table.getColumn(filter.key)}
							title={title}
							options={filter.options}
						/>
					);
				})}
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
