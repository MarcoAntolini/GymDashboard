"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import {
	deleteProduct,
	editProduct,
	listProducts,
	type ProductListResult,
} from "@/data-access/products";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	PRODUCT_LIST_DEFAULT_SORT,
	PRODUCT_LIST_FILTER_IDS,
	PRODUCT_LIST_SORT_COLUMNS,
} from "@/lib/domain/product-list-query";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { Product } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
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

	const [result, setResult] = useState<ProductListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listProducts(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

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

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
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
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.prodotti}
				/>
			}
		/>
	);
}
