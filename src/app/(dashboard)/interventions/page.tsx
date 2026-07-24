"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteIntervention,
	editIntervention,
	listInterventions,
	type InterventionListResult,
} from "@/data-access/interventions";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	INTERVENTION_LIST_DEFAULT_SORT,
	INTERVENTION_LIST_FILTER_IDS,
	INTERVENTION_LIST_SORT_COLUMNS,
} from "@/lib/domain/intervention-list-query";
import { CREATE_GUIDANCE } from "@/lib/format/create-guidance";
import { Intervention } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { columns } from "./columns";

const INTERVENTION_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "paymentId", label: "ID pagamento", placeholder: "ID pagamento" },
	{ id: "maker", label: "Attuatore", placeholder: "Attuatore" },
];

const EMPTY_FILTERS = Object.fromEntries(
	INTERVENTION_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof INTERVENTION_LIST_FILTER_IDS)[number], string>;

export default function InterventionsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: INTERVENTION_LIST_SORT_COLUMNS,
		defaultSort: INTERVENTION_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<InterventionListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listInterventions(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const handleDelete = useCallback(
		async (intervention: Pick<Intervention, "paymentId">) => {
			await deleteIntervention(intervention);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (intervention: Intervention) => {
			await editIntervention({
				paymentId: intervention.paymentId,
				description: intervention.description,
				maker: intervention.maker,
				startingTime: intervention.startingTime,
				endingTime: intervention.endingTime,
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
			createHint={CREATE_GUIDANCE.interventi}
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
					filterFields={INTERVENTION_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={`Nessun Intervento registrato. ${CREATE_GUIDANCE.interventi}`}
				/>
			}
		/>
	);
}
