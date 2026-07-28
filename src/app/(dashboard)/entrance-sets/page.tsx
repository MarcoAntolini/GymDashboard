"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createEntranceSet,
	deleteEntranceSet,
	editEntranceSet,
	listEntranceSets,
} from "@/data-access/entranceSets";
import { useServerList } from "@/hooks/useServerList";
import {
	ENTRANCE_SET_DEFAULT_SORT,
	ENTRANCE_SET_FILTER_ALLOWLIST,
	ENTRANCE_SET_FILTER_LABELS,
	ENTRANCE_SET_SORT_ALLOWLIST,
} from "@/lib/list/entranceSets";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { columns, formSchema, type EntranceSetRow } from "./columns";

export default function EntranceSetsPage() {
	const list = useServerList<EntranceSetRow>({
		list: listEntranceSets,
		sortAllowlist: ENTRANCE_SET_SORT_ALLOWLIST,
		filterAllowlist: ENTRANCE_SET_FILTER_ALLOWLIST,
		defaultSort: [...ENTRANCE_SET_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (entranceSet: Pick<EntranceSetRow, "productCode">) => {
			await deleteEntranceSet(entranceSet);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (entranceSet: EntranceSetRow) => {
			const updated = await editEntranceSet({
				productCode: entranceSet.productCode,
				entranceNumber: entranceSet.entranceNumber,
			});
			setItems((prev) =>
				prev.map((item) =>
					item.productCode === updated.productCode ? updated : item
				)
			);
		},
		[setItems]
	);

	const handleCreateEntranceSet = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createEntranceSet(values);
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi pacchetto ingressi",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Codice prodotto</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="entranceNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Numero ingressi</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) =>
											field.onChange(parseInt(e.target.value))
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					productCode: "",
					entranceNumber: 10,
				},
				submitAction: handleCreateEntranceSet,
			} as FormData<typeof formSchema>,
		},
	];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...ENTRANCE_SET_FILTER_ALLOWLIST]}
					filterLabels={ENTRANCE_SET_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun pacchetto ingressi"
							hint="Usa Aggiungi pacchetto ingressi per definire il primo Pacchetto."
						/>
					}
					serverList={{
						manual: true,
						pageCount: list.pageCount,
						rowCount: list.total,
						sorting: list.sorting,
						onSortingChange: list.onSortingChange,
						pagination: list.pagination,
						onPaginationChange: list.onPaginationChange,
						draftFilters: list.draftFilters,
						onDraftFilterChange: list.setDraftFilter,
						onApplyFilters: list.applyFilters,
						onResetFilters: list.resetFilters,
						filtersDirty: list.filtersDirty,
						appliedFilters: list.query.filters,
					}}
				/>
			}
		/>
	);
}
