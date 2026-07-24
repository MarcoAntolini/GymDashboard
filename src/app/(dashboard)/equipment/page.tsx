"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteEquipment,
	editEquipment,
	listEquipment,
	type EquipmentListResult,
} from "@/data-access/equipment";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	EQUIPMENT_LIST_DEFAULT_SORT,
	EQUIPMENT_LIST_FILTER_IDS,
	EQUIPMENT_LIST_SORT_COLUMNS,
} from "@/lib/domain/equipment-list-query";
import { CREATE_GUIDANCE } from "@/lib/format/create-guidance";
import { Equipment } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { columns } from "./columns";

const EQUIPMENT_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "paymentId", label: "ID pagamento", placeholder: "ID pagamento" },
	{ id: "provider", label: "Fornitore", placeholder: "Fornitore" },
];

const EMPTY_FILTERS = Object.fromEntries(
	EQUIPMENT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof EQUIPMENT_LIST_FILTER_IDS)[number], string>;

export default function EquipmentPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: EQUIPMENT_LIST_SORT_COLUMNS,
		defaultSort: EQUIPMENT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<EquipmentListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listEquipment(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const handleDelete = useCallback(
		async (equipment: Pick<Equipment, "paymentId">) => {
			await deleteEquipment(equipment);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (equipment: Equipment) => {
			await editEquipment({
				paymentId: equipment.paymentId,
				description: equipment.description,
				provider: equipment.provider,
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
			createHint={CREATE_GUIDANCE.attrezzatura}
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
					filterFields={EQUIPMENT_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={`Nessuna Attrezzatura registrata. ${CREATE_GUIDANCE.attrezzatura}`}
				/>
			}
		/>
	);
}
