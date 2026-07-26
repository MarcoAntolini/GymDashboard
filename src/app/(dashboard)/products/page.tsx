"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import {
	deleteProduct,
	editProduct,
	listProducts,
} from "@/data-access/products";
import { useServerList } from "@/hooks/useServerList";
import {
	PRODUCT_DEFAULT_SORT,
	PRODUCT_FILTER_ALLOWLIST,
	PRODUCT_FILTER_LABELS,
	PRODUCT_SORT_ALLOWLIST,
} from "@/lib/list/products";
import { useCallback } from "react";
import { columns, type ProductRow } from "./columns";

export default function ProductsPage() {
	const list = useServerList<ProductRow>({
		list: listProducts,
		sortAllowlist: PRODUCT_SORT_ALLOWLIST,
		filterAllowlist: PRODUCT_FILTER_ALLOWLIST,
		defaultSort: [...PRODUCT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (product: Pick<ProductRow, "code">) => {
			await deleteProduct(product);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (product: ProductRow) => {
			const updated = await editProduct({ code: product.code });
			setItems((prev) =>
				prev.map((item) =>
					item.code === updated.code
						? { ...item, code: updated.code }
						: item
				)
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
					filters={[...PRODUCT_FILTER_ALLOWLIST]}
					filterLabels={PRODUCT_FILTER_LABELS}
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
