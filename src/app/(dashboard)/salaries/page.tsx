"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteSalary, editSalary, listSalaries } from "@/data-access/salaries";
import { useServerList } from "@/hooks/useServerList";
import {
	SALARY_DEFAULT_SORT,
	SALARY_FILTER_ALLOWLIST,
	SALARY_SORT_ALLOWLIST,
} from "@/lib/list/salaries";
import { Salary } from "@prisma/client";
import { useCallback } from "react";
import { columns } from "./columns";

export default function Salaries() {
	const list = useServerList<Salary>({
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

	return list.isLoading && list.items.length === 0 ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					filters={[...SALARY_FILTER_ALLOWLIST]}
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
