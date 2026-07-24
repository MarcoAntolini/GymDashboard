"use client";

import Dashboard from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteProduct,
	editProduct,
	listProducts,
	type ProductListResult,
} from "@/data-access/products";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import {
	PRODUCT_LIST_DEFAULT_SORT,
	PRODUCT_LIST_FILTER_IDS,
	PRODUCT_LIST_SORT_COLUMNS,
} from "@/lib/domain/product-list-query";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { CREATE_GUIDANCE } from "@/lib/format/create-guidance";
import { Product } from "@prisma/client";
import { useCallback, useMemo } from "react";
import { columns } from "./columns";

const PRODUCT_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "code", label: "Codice", placeholder: "Codice prodotto" },
];

const EMPTY_FILTERS = Object.fromEntries(
	PRODUCT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof PRODUCT_LIST_FILTER_IDS)[number], string>;

export default function ProductsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: PRODUCT_LIST_SORT_COLUMNS,
		defaultSort: PRODUCT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listProducts(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<ProductListResult>(loadList);

	const handleDelete = useCallback(
		async (product: Pick<Product, "code">) => {
			await deleteProduct(product);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (product: Product) => {
			await editProduct({ code: product.code });
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
			createHint={CREATE_GUIDANCE.prodotti}
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
					filterFields={PRODUCT_FILTER_FIELDS}
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
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.prodotti}
				/>
			}
		/>
	);
}
