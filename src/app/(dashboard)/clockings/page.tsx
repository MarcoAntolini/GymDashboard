"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createClocking,
	deleteClocking,
	editClocking,
	listClockings,
	type ClockingRow,
} from "@/data-access/clockings";
import { getEmployee } from "@/data-access/employees";
import { useServerList } from "@/hooks/useServerList";
import {
	CLOCKING_DATE_FILTERS,
	CLOCKING_DEFAULT_SORT,
	CLOCKING_FILTER_ALLOWLIST,
	CLOCKING_SORT_ALLOWLIST,
	CLOCKING_FILTER_LABELS,
} from "@/lib/list/clockings";
import { Clocking } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Clockings() {
	const list = useServerList<ClockingRow>({
		list: listClockings,
		sortAllowlist: CLOCKING_SORT_ALLOWLIST,
		filterAllowlist: CLOCKING_FILTER_ALLOWLIST,
		defaultSort: [...CLOCKING_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (clocking: Pick<Clocking, "employeeId" | "entranceTime">) => {
			await deleteClocking(clocking);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (clocking: Clocking) => {
			const updated = await editClocking(clocking);
			setItems((prev) =>
				prev.map((item) =>
					item.employeeId === updated.employeeId &&
					new Date(item.entranceTime).getTime() ===
						new Date(updated.entranceTime).getTime()
						? updated
						: item
				)
			);
		},
		[setItems]
	);

	const handleCreateClocking = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const employee = await getEmployee(values.employeeId);
			if (!employee) {
				toast.error("Dipendente non trovato");
				return;
			}
			await createClocking(values);
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi timbratura",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="employeeId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Dipendente</FormLabel>
								<FormControl>
									<Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} min={0} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="entranceTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Entrata</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="exitTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Uscita</FormLabel>
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
					exitTime: undefined
				},
				submitAction: handleCreateClocking
			} as FormData<typeof formSchema>
		}
	];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) =>
						`${row.employeeId}::${new Date(row.entranceTime).toISOString()}`
					}
					entityLabel="Timbratura"
					bulkDeleteRow={async (row) => {
						await deleteClocking({
							employeeId: row.employeeId,
							entranceTime: row.entranceTime,
						});
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...CLOCKING_FILTER_ALLOWLIST]}
					dateFilters={[...CLOCKING_DATE_FILTERS]}
					filterLabels={CLOCKING_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessuna timbratura"
							hint="Usa Aggiungi timbratura per registrare la prima Timbratura."
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
