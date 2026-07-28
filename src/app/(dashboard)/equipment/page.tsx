"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { CreateElsewhereHint } from "@/components/ui/create-elsewhere-hint";
import {
	deleteEquipment,
	editEquipment,
	listEquipment,
	type EquipmentRow,
} from "@/data-access/equipment";
import { useServerList } from "@/hooks/useServerList";
import {
	EQUIPMENT_DEFAULT_SORT,
	EQUIPMENT_FILTER_ALLOWLIST,
	EQUIPMENT_FILTER_LABELS,
	EQUIPMENT_SORT_ALLOWLIST,
} from "@/lib/list/equipment";
import { Equipment } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function EquipmentPage() {
	const list = useServerList<EquipmentRow>({
		list: listEquipment,
		sortAllowlist: EQUIPMENT_SORT_ALLOWLIST,
		filterAllowlist: EQUIPMENT_FILTER_ALLOWLIST,
		defaultSort: [...EQUIPMENT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (equipment: Pick<Equipment, "paymentId">) => {
			await deleteEquipment(equipment);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (equipment: Equipment) => {
			const updated = await editEquipment(equipment);
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
					message="L'Attrezzatura si crea da"
					href="/payments"
					linkLabel="Pagamenti (tipo Attrezzatura)"
				/>
			}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => String(row.paymentId)}
					entityLabel="Attrezzatura"
					bulkDeleteRow={async (row) => {
						await deleteEquipment({ paymentId: row.paymentId });
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...EQUIPMENT_FILTER_ALLOWLIST]}
					filterLabels={EQUIPMENT_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessuna attrezzatura"
							hint="Crea un Pagamento di tipo Attrezzatura nella sezione Pagamenti."
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
