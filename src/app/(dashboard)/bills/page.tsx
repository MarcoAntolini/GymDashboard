"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { CreateElsewhereHint } from "@/components/ui/create-elsewhere-hint";
import { deleteBill, editBill, listBills, type BillRow } from "@/data-access/bills";
import { useServerList } from "@/hooks/useServerList";
import {
	BILL_DEFAULT_SORT,
	BILL_FILTER_ALLOWLIST,
	BILL_FILTER_LABELS,
	BILL_SORT_ALLOWLIST,
} from "@/lib/list/bills";
import { Bill } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function BillsPage() {
	const list = useServerList<BillRow>({
		list: listBills,
		sortAllowlist: BILL_SORT_ALLOWLIST,
		filterAllowlist: BILL_FILTER_ALLOWLIST,
		defaultSort: [...BILL_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (bill: Pick<Bill, "paymentId">) => {
			await deleteBill(bill);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (bill: Bill) => {
			const updated = await editBill(bill);
			setItems((prev) =>
				prev.map((item) => (item.paymentId === updated.paymentId ? updated : item))
			);
		},
		[setItems]
	);

	return (
		<Dashboard
			actions={[]}
			extraToolbar={
				<CreateElsewhereHint
					message="Le Bollette si creano da"
					href="/payments"
					linkLabel="Pagamenti (tipo Bolletta)"
				/>
			}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...BILL_FILTER_ALLOWLIST]}
					filterLabels={BILL_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessuna bolletta"
							hint="Crea un Pagamento di tipo Bolletta nella sezione Pagamenti."
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
