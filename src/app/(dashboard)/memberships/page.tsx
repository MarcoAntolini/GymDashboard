"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createMembership,
	deleteMembership,
	editMembership,
	listMemberships,
	type MembershipListResult,
} from "@/data-access/memberships";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import {
	MEMBERSHIP_LIST_DEFAULT_SORT,
	MEMBERSHIP_LIST_FILTER_IDS,
	MEMBERSHIP_LIST_SORT_COLUMNS,
} from "@/lib/domain/membership-list-query";
import { Membership } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

const MEMBERSHIP_FILTER_FIELDS: ServerListFilterField[] = [
	{
		id: "productCode",
		label: "Codice prodotto",
		placeholder: "Codice prodotto",
	},
	{ id: "duration", label: "Durata (giorni)", placeholder: "Durata (giorni)" },
];

const EMPTY_FILTERS = Object.fromEntries(
	MEMBERSHIP_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof MEMBERSHIP_LIST_FILTER_IDS)[number], string>;

export default function MembershipsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: MEMBERSHIP_LIST_SORT_COLUMNS,
		defaultSort: MEMBERSHIP_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listMemberships(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<MembershipListResult>(loadList);

	const handleDelete = useCallback(
		async (membership: Pick<Membership, "productCode">) => {
			await deleteMembership(membership);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (membership: Membership) => {
			await editMembership({
				productCode: membership.productCode,
				duration: membership.duration,
			});
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateMembership = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createMembership(values);
			await fetchList();
		},
		[fetchList]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit),
		[handleDelete, handleEdit]
	);

	const actions: Action[] = [
		{
			title: "Add Membership",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Code</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="duration"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Duration (days)</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) =>
											field.onChange(parseInt(e.target.value))
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					productCode: "",
					duration: 30,
				},
				submitAction: handleCreateMembership,
			} as FormData<typeof formSchema>,
		},
	];

	return (
		<Dashboard
			actions={actions}
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
					filterFields={MEMBERSHIP_FILTER_FIELDS}
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
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.abbonamenti}
					getRowId={(row) => row.productCode}
					bulk={{
						entityLabel: "Abbonamento",
						deleteRow: async (row) => {
							await deleteMembership({ productCode: row.productCode });
						},
						onDeleted: fetchList,
					}}
				/>
			}
		/>
	);
}
