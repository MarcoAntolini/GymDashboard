"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
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
	type EntranceSetListResult,
} from "@/data-access/entranceSets";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import {
	ENTRANCE_SET_LIST_DEFAULT_SORT,
	ENTRANCE_SET_LIST_FILTER_IDS,
	ENTRANCE_SET_LIST_SORT_COLUMNS,
} from "@/lib/domain/entrance-set-list-query";
import { EntranceSet } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

const ENTRANCE_SET_FILTER_FIELDS: ServerListFilterField[] = [
	{
		id: "productCode",
		label: "Codice prodotto",
		placeholder: "Codice prodotto",
	},
	{
		id: "entranceNumber",
		label: "Numero ingressi",
		placeholder: "Numero ingressi",
	},
];

const EMPTY_FILTERS = Object.fromEntries(
	ENTRANCE_SET_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof ENTRANCE_SET_LIST_FILTER_IDS)[number], string>;

export default function EntranceSetsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: ENTRANCE_SET_LIST_SORT_COLUMNS,
		defaultSort: ENTRANCE_SET_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listEntranceSets(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<EntranceSetListResult>(loadList);

	const handleDelete = useCallback(
		async (entranceSet: Pick<EntranceSet, "productCode">) => {
			await deleteEntranceSet(entranceSet);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (entranceSet: EntranceSet) => {
			await editEntranceSet({
				productCode: entranceSet.productCode,
				entranceNumber: entranceSet.entranceNumber,
			});
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateEntranceSet = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createEntranceSet(values);
			await fetchList();
		},
		[fetchList]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit),
		[handleDelete, handleEdit]
	);

	const actions: Action[] = [
		{
			title: "Add Entrance Set",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Code</FormLabel>
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
								<FormLabel>Number of Entrances</FormLabel>
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
				<ServerDataTable
					columns={tableColumns}
					data={result?.rows ?? []}
					total={result?.total ?? 0}
					page={listQuery.page}
					pageSize={listQuery.pageSize}
					pageCount={result?.pageCount ?? 0}
					sort={listQuery.sort}
					onSortChange={listQuery.setSort}
					onPageChange={listQuery.setPage}
					onPageSizeChange={listQuery.setPageSize}
					filterFields={ENTRANCE_SET_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					listStatus={listStatus}
					listError={listError}
					onRetry={retryList}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.pacchetti}
				/>
			}
		/>
	);
}
