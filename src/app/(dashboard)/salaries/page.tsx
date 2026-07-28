"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { CreateElsewhereHint } from "@/components/ui/create-elsewhere-hint";
import {
	deleteSalary,
	editSalary,
	listSalaries,
	type SalaryRow,
} from "@/data-access/salaries";
import { useServerList } from "@/hooks/useServerList";
import {
	SALARY_DEFAULT_SORT,
	SALARY_FILTER_ALLOWLIST,
	SALARY_FILTER_LABELS,
	SALARY_SORT_ALLOWLIST,
} from "@/lib/list/salaries";
import { Salary } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function Salaries() {
	const list = useServerList<SalaryRow>({
		list: listSalaries,
		sortAllowlist: SALARY_SORT_ALLOWLIST,
		filterAllowlist: SALARY_FILTER_ALLOWLIST,
		defaultSort: [...SALARY_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (salary: Pick<Salary, "paymentId">) => {
			await deleteSalary(salary);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (salary: Salary) => {
			const updated = await editSalary(salary);
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
					message="Gli Stipendi si creano da"
					href="/payments"
					linkLabel="Pagamenti (tipo Stipendio)"
				/>
			}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => String(row.paymentId)}
					entityLabel="Stipendio"
					bulkDeleteRow={async (row) => {
						await deleteSalary({ paymentId: row.paymentId });
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...SALARY_FILTER_ALLOWLIST]}
					filterLabels={SALARY_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessuno stipendio"
							hint="Crea un Pagamento di tipo Stipendio nella sezione Pagamenti."
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
