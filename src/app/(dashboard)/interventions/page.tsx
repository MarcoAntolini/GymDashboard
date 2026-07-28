"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { CreateElsewhereHint } from "@/components/ui/create-elsewhere-hint";
import {
	deleteIntervention,
	editIntervention,
	listInterventions,
	type InterventionRow,
} from "@/data-access/interventions";
import { useServerList } from "@/hooks/useServerList";
import {
	INTERVENTION_DEFAULT_SORT,
	INTERVENTION_FILTER_ALLOWLIST,
	INTERVENTION_FILTER_LABELS,
	INTERVENTION_SORT_ALLOWLIST,
} from "@/lib/list/interventions";
import { Intervention } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function InterventionsPage() {
	const list = useServerList<InterventionRow>({
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

	return (
		<Dashboard
			actions={[]}
			extraToolbar={
				<CreateElsewhereHint
					message="Gli Interventi si creano da"
					href="/payments"
					linkLabel="Pagamenti (tipo Intervento)"
				/>
			}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...INTERVENTION_FILTER_ALLOWLIST]}
					filterLabels={INTERVENTION_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun intervento"
							hint="Crea un Pagamento di tipo Intervento nella sezione Pagamenti."
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
