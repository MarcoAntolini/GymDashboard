"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteBill,
	editBill,
	listBills,
	type BillListResult,
} from "@/data-access/bills";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	BILL_LIST_DEFAULT_SORT,
	BILL_LIST_FILTER_IDS,
	BILL_LIST_SORT_COLUMNS,
} from "@/lib/domain/bill-list-query";
import { CREATE_GUIDANCE } from "@/lib/format/create-guidance";
import { Bill } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { columns } from "./columns";

const BILL_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "paymentId", label: "ID pagamento", placeholder: "ID pagamento" },
	{ id: "provider", label: "Fornitore", placeholder: "Fornitore" },
];

const EMPTY_FILTERS = Object.fromEntries(
	BILL_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof BILL_LIST_FILTER_IDS)[number], string>;

export default function BillsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: BILL_LIST_SORT_COLUMNS,
		defaultSort: BILL_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<BillListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listBills(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const handleDelete = useCallback(
		async (bill: Pick<Bill, "paymentId">) => {
			await deleteBill(bill);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (bill: Bill) => {
			await editBill({
				paymentId: bill.paymentId,
				description: bill.description,
				provider: bill.provider,
			});
			await fetchList();
		},
		[fetchList]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit),
		[handleDelete, handleEdit]
	);

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
			createHint={CREATE_GUIDANCE.bollette}
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
					filterFields={BILL_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={`Nessuna Bolletta registrata. ${CREATE_GUIDANCE.bollette}`}
				/>
			}
		/>
	);
}
