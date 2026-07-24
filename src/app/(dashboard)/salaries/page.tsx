"use client";

import Dashboard from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteSalary,
	editSalary,
	listSalaries,
	type SalaryListResult,
} from "@/data-access/salaries";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import {
	SALARY_LIST_DEFAULT_SORT,
	SALARY_LIST_FILTER_IDS,
	SALARY_LIST_SORT_COLUMNS,
} from "@/lib/domain/salary-list-query";
import { CREATE_GUIDANCE } from "@/lib/format/create-guidance";
import { Salary } from "@prisma/client";
import { useCallback, useMemo } from "react";
import { columns } from "./columns";

const SALARY_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "paymentId", label: "ID pagamento", placeholder: "ID pagamento" },
	{ id: "employeeId", label: "ID dipendente", placeholder: "ID dipendente" },
];

const EMPTY_FILTERS = Object.fromEntries(
	SALARY_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof SALARY_LIST_FILTER_IDS)[number], string>;

export default function Salaries() {
	const listQuery = useServerListQuery({
		allowedSortColumns: SALARY_LIST_SORT_COLUMNS,
		defaultSort: SALARY_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listSalaries(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<SalaryListResult>(loadList);

	const handleDelete = useCallback(
		async (salary: Pick<Salary, "paymentId">) => {
			await deleteSalary(salary);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (salary: Salary) => {
			await editSalary({
				paymentId: salary.paymentId,
				employeeId: salary.employeeId,
			});
			await fetchList();
		},
		[fetchList]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit),
		[handleDelete, handleEdit]
	);

	return (
		<Dashboard
			actions={[]}
			createHint={CREATE_GUIDANCE.stipendi}
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
					filterFields={SALARY_FILTER_FIELDS}
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
					datasetEmptyMessage={`Nessuno Stipendio registrato. ${CREATE_GUIDANCE.stipendi}`}
					getRowId={(row) => String(row.paymentId)}
					bulk={{
						entityLabel: "Stipendio",
						deleteRow: async (row) => {
							await deleteSalary({ paymentId: row.paymentId });
						},
						onDeleted: fetchList,
					}}
				/>
			}
		/>
	);
}
