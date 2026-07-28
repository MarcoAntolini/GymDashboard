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
	createMembership,
	deleteMembership,
	editMembership,
	listMemberships,
} from "@/data-access/memberships";
import { useServerList } from "@/hooks/useServerList";
import {
	MEMBERSHIP_DEFAULT_SORT,
	MEMBERSHIP_FILTER_ALLOWLIST,
	MEMBERSHIP_FILTER_LABELS,
	MEMBERSHIP_SORT_ALLOWLIST,
} from "@/lib/list/memberships";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { columns, formSchema, type MembershipRow } from "./columns";

export default function MembershipsPage() {
	const list = useServerList<MembershipRow>({
		list: listMemberships,
		sortAllowlist: MEMBERSHIP_SORT_ALLOWLIST,
		filterAllowlist: MEMBERSHIP_FILTER_ALLOWLIST,
		defaultSort: [...MEMBERSHIP_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (membership: Pick<MembershipRow, "productCode">) => {
			await deleteMembership(membership);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (membership: MembershipRow) => {
			const updated = await editMembership({
				productCode: membership.productCode,
				duration: membership.duration,
			});
			setItems((prev) =>
				prev.map((item) =>
					item.productCode === updated.productCode ? updated : item
				)
			);
		},
		[setItems]
	);

	const handleCreateMembership = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createMembership(values);
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi abbonamento",
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
						name="duration"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Durata (giorni)</FormLabel>
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
					duration: 30,
				},
				submitAction: handleCreateMembership,
			} as FormData<typeof formSchema>,
		},
	];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => row.productCode}
					entityLabel="Abbonamento"
					bulkDeleteRow={async (row) => {
						await deleteMembership({ productCode: row.productCode });
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...MEMBERSHIP_FILTER_ALLOWLIST]}
					filterLabels={MEMBERSHIP_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun abbonamento"
							hint="Usa Aggiungi abbonamento per definire il primo Abbonamento."
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
