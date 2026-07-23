"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
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
import {
	CLOCKING_LIST_DEFAULT_SORT,
	CLOCKING_LIST_FILTER_IDS,
	CLOCKING_LIST_SORT_COLUMNS,
} from "@/lib/domain/clocking-list-query";
import { Clocking } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

	const [result, setResult] = useState<ClockingListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listClockings(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

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

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
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
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage="Nessuna timbratura registrata."
				/>
			}
		/>
	);
}
