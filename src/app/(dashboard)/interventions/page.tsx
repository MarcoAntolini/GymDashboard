"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import {
	deleteIntervention,
	editIntervention,
	listInterventions,
} from "@/data-access/interventions";
import { useServerList } from "@/hooks/useServerList";
import {
	INTERVENTION_DEFAULT_SORT,
	INTERVENTION_FILTER_ALLOWLIST,
	INTERVENTION_SORT_ALLOWLIST,
} from "@/lib/list/interventions";
import { Intervention } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function InterventionsPage() {
	const list = useServerList<Intervention>({
		list: listInterventions,
		sortAllowlist: INTERVENTION_SORT_ALLOWLIST,
		filterAllowlist: INTERVENTION_FILTER_ALLOWLIST,
		defaultSort: [...INTERVENTION_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (intervention: Pick<Intervention, "paymentId">) => {
			await deleteIntervention(intervention);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (intervention: Intervention) => {
			const updated = await editIntervention(intervention);
			setItems((prev) =>
				prev.map((item) =>
					item.paymentId === updated.paymentId ? updated : item
				)
			);
		},
		[setItems]
	);

	return list.isLoading && list.items.length === 0 ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					filters={[...INTERVENTION_FILTER_ALLOWLIST]}
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
					}}
				/>
			}
		/>
	);
}
