"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createClocking,
	deleteClocking,
	editClocking,
	listClockings,
	type ClockingListResult,
} from "@/data-access/clockings";
import { getEmployee } from "@/data-access/employees";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import {
	CLOCKING_LIST_DEFAULT_SORT,
	CLOCKING_LIST_FILTER_IDS,
	CLOCKING_LIST_SORT_COLUMNS,
} from "@/lib/domain/clocking-list-query";
import { Clocking } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { columns, formSchema } from "./columns";

const CLOCKING_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "employeeId", label: "ID dipendente", placeholder: "ID dipendente" },
];

const EMPTY_FILTERS = Object.fromEntries(
	CLOCKING_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof CLOCKING_LIST_FILTER_IDS)[number], string>;

export default function Clockings() {
	const listQuery = useServerListQuery({
		allowedSortColumns: CLOCKING_LIST_SORT_COLUMNS,
		defaultSort: CLOCKING_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listClockings(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<ClockingListResult>(loadList);

	const handleDelete = useCallback(
		async (clocking: Pick<Clocking, "employeeId" | "entranceTime">) => {
			await deleteClocking(clocking);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (clocking: Clocking) => {
			await editClocking(clocking);
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateClocking = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const employee = await getEmployee(values.employeeId);
			if (!employee) {
				toast.error("Employee not found");
				return;
			}
			await createClocking(values);
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
			title: "Add Clocking",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="employeeId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Employee ID</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) => field.onChange(parseInt(e.target.value))}
										min={0}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="entranceTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Entrance Time</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="exitTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Exit Time</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					employeeId: 0,
					entranceTime: new Date(),
					exitTime: undefined,
				},
				submitAction: handleCreateClocking,
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
					filterFields={CLOCKING_FILTER_FIELDS}
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
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.timbrature}
				/>
			}
		/>
	);
}
