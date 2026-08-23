"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useTableChromeActions } from "@/components/ui/data-table/table-chrome-actions-context";
import { columnLabel } from "@/lib/domain/column-labels";
import type { ListFacetedFilter, ListFilters } from "@/lib/list";
import { cn } from "@/lib/utils";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { ATTR_ICON } from "@/lib/domain/icons";
import { X } from "lucide-react";
import * as React from "react";
import { TableFacetedFilter } from "./table-faceted-filter";

export type DataTableFacetedFilter = ListFacetedFilter;

export type TableToolbarServerListProps = {
	draftFilters: ListFilters;
	onDraftFilterChange: (key: string, value: string | string[] | undefined) => void;
	onApplyFilters: () => void;
	onResetFilters: () => void;
	filtersDirty?: boolean;
	appliedFilters?: ListFilters;
};

interface TableToolbarProps<TData> {
	table: Table<TData>;
	filters: string[];
	facetedFilters?: ListFacetedFilter[];
	filterLabels?: Record<string, string>;
	serverList?: TableToolbarServerListProps;
	/** Override del slot sinistro (altrimenti azioni dal Dashboard). */
	toolbarActions?: React.ReactNode;
}

function filterPlaceholder(filter: string, labels?: Record<string, string>): string {
	const labeled = labels?.[filter];
	if (labeled) return labeled;
	return columnLabel(filter);
}

function isIdFilter(filter: string): boolean {
	return filter === "id" || filter.endsWith("Id");
}

function draftFacetValue(raw: ListFilters[string]): string[] {
	if (typeof raw === "string" && raw) return [raw];
	if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
	if (typeof raw === "boolean") return [String(raw)];
	return [];
}

export function countAppliedFilterKeys(filters: ListFilters | undefined): number {
	if (!filters) return 0;
	return Object.keys(filters).reduce((count, key) => {
		const value = filters[key];
		if (value == null) return count;
		if (Array.isArray(value)) return value.length > 0 ? count + 1 : count;
		return String(value).trim() !== "" ? count + 1 : count;
	}, 0);
}

function columnFiltersToDraft(filters: ColumnFiltersState): ListFilters {
	const next: ListFilters = {};
	for (const filter of filters) {
		const value = filter.value;
		if (value == null || value === "") continue;
		if (Array.isArray(value) && value.length === 0) continue;
		next[filter.id] = value as ListFilters[string];
	}
	return next;
}

function toDraftChangeValue(
	value: ListFilters[string]
): string | string[] | undefined {
	if (value == null || value === "") return undefined;
	if (Array.isArray(value)) return value.length ? value : undefined;
	if (typeof value === "boolean") return String(value);
	return String(value);
}

function revertDraftToApplied(
	draft: ListFilters,
	applied: ListFilters,
	onDraftFilterChange: (key: string, value: string | string[] | undefined) => void
) {
	const keys = new Set([...Object.keys(draft), ...Object.keys(applied)]);
	for (const key of keys) {
		onDraftFilterChange(key, toDraftChangeValue(applied[key]));
	}
}

function clearDraft(
	draft: ListFilters,
	onDraftFilterChange: (key: string, value: string | string[] | undefined) => void
) {
	for (const key of Object.keys(draft)) {
		onDraftFilterChange(key, undefined);
	}
}

function applyClientDraft<TData>(
	table: Table<TData>,
	draft: ListFilters,
	keys: string[]
) {
	for (const key of keys) {
		const raw = draft[key];
		if (Array.isArray(raw)) {
			table.getColumn(key)?.setFilterValue(raw.length ? raw : undefined);
			continue;
		}
		if (raw == null || String(raw).trim() === "") {
			table.getColumn(key)?.setFilterValue(undefined);
			continue;
		}
		table.getColumn(key)?.setFilterValue(raw);
	}
}

export default function TableToolbar<TData>({
	table,
	filters,
	facetedFilters,
	filterLabels,
	serverList,
	toolbarActions,
}: TableToolbarProps<TData>) {
	const chromeActions = useTableChromeActions();
	const leftActions = toolbarActions ?? chromeActions;
	const isServer = !!serverList;
	const facetedKeys = new Set(facetedFilters?.map((filter) => filter.key) ?? []);
	const textFilters = filters.filter((key) => !facetedKeys.has(key));
	const filterKeys = React.useMemo(
		() => [...textFilters, ...(facetedFilters?.map((filter) => filter.key) ?? [])],
		[textFilters, facetedFilters]
	);
	const hasFilterFields = filterKeys.length > 0;

	const [sheetOpen, setSheetOpen] = React.useState(false);
	const skipRevertRef = React.useRef(false);
	const [clientDraft, setClientDraft] = React.useState<ListFilters>({});

	const appliedCount = isServer
		? countAppliedFilterKeys(serverList.appliedFilters)
		: countAppliedFilterKeys(columnFiltersToDraft(table.getState().columnFilters));

	const draftFilters = isServer ? serverList.draftFilters : clientDraft;

	const setDraftKey = React.useCallback(
		(key: string, value: string | string[] | undefined) => {
			if (isServer) {
				serverList.onDraftFilterChange(key, value);
				return;
			}
			setClientDraft((prev) => {
				const next = { ...prev };
				if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
					delete next[key];
				} else {
					next[key] = value;
				}
				return next;
			});
		},
		[isServer, serverList]
	);

	const handleSheetOpenChange = (open: boolean) => {
		if (open) {
			skipRevertRef.current = false;
			if (!isServer) {
				setClientDraft(columnFiltersToDraft(table.getState().columnFilters));
			}
			setSheetOpen(true);
			return;
		}
		if (!skipRevertRef.current && isServer) {
			revertDraftToApplied(
				serverList.draftFilters,
				serverList.appliedFilters ?? {},
				serverList.onDraftFilterChange
			);
		}
		skipRevertRef.current = false;
		setSheetOpen(false);
	};

	const handleApply = () => {
		skipRevertRef.current = true;
		if (isServer) {
			serverList.onApplyFilters();
		} else {
			applyClientDraft(table, clientDraft, filterKeys);
		}
		setSheetOpen(false);
	};

	const handleSheetResetDraft = () => {
		if (isServer) {
			clearDraft(serverList.draftFilters, serverList.onDraftFilterChange);
			return;
		}
		setClientDraft({});
	};

	const handleToolbarReset = () => {
		if (isServer) {
			serverList.onResetFilters();
			return;
		}
		table.resetColumnFilters();
		setClientDraft({});
	};

	return (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
				{leftActions}
			</div>
			<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
				{hasFilterFields ? (
					<>
						<Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
							<SheetTrigger asChild>
								<Button type="button" variant="outline">
									<ATTR_ICON.filter className="mr-2 h-4 w-4" />
									Filtri
									{appliedCount > 0 ? (
										<Badge
											variant="secondary"
											className="ml-2 rounded-sm px-1.5 font-normal tabular-nums"
										>
											{appliedCount}
										</Badge>
									) : null}
								</Button>
							</SheetTrigger>
							<SheetContent
								side="right"
								className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
							>
								<SheetHeader className="flex flex-col gap-1 pr-8 text-left">
									<SheetTitle>Filtri</SheetTitle>
								</SheetHeader>
								<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1">
									{textFilters.map((filter) => {
										const id = `table-filter-${filter}`;
										return (
											<div key={filter} className="flex flex-col gap-2">
												<Label htmlFor={id}>
													{filterPlaceholder(filter, filterLabels)}
												</Label>
												<Input
													id={id}
													placeholder={filterPlaceholder(filter, filterLabels)}
													value={String(draftFilters[filter] ?? "")}
													onChange={(event) => {
														const value = event.target.value;
														setDraftKey(filter, value || undefined);
													}}
													onKeyDown={(event) => {
														if (event.key === "Enter") {
															event.preventDefault();
															handleApply();
														}
													}}
													className={cn(isIdFilter(filter) && "max-w-32")}
												/>
											</div>
										);
									})}
									{facetedFilters?.map((filter) => {
										const title =
											filter.title ??
											filterLabels?.[filter.key] ??
											columnLabel(filter.key);
										return (
											<div key={filter.key} className="flex flex-col gap-2">
												<Label>{title}</Label>
												<TableFacetedFilter
													title={title}
													options={filter.options}
													className="h-10 w-full justify-start"
													value={draftFacetValue(draftFilters[filter.key])}
													onValueChange={(next) => setDraftKey(filter.key, next)}
												/>
											</div>
										);
									})}
								</div>
								<SheetFooter className="mt-auto flex-row justify-between gap-2 border-t pt-4 sm:justify-between">
									<Button
										type="button"
										variant="ghost"
										onClick={handleSheetResetDraft}
									>
										Reimposta
									</Button>
									<Button type="button" onClick={handleApply}>
										Applica
									</Button>
								</SheetFooter>
							</SheetContent>
						</Sheet>
						{appliedCount > 0 ? (
							<Button
								type="button"
								variant="ghost"
								onClick={handleToolbarReset}
								className="h-10 px-2 lg:px-3"
							>
								Reimposta
								<X className="ml-2 h-4 w-4" />
							</Button>
						) : null}
					</>
				) : null}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">Colonne</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.id !== "actions")
							.filter((column) => column.getCanHide())
							.map((column) => (
								<DropdownMenuCheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{columnLabel(column.id)}
								</DropdownMenuCheckboxItem>
							))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
