"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
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
import Link from "next/link";
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

	return (
		<Dashboard
			actions={[]}
			extraToolbar={
				<p className="text-sm text-muted-foreground">
					I Prodotti si creano da{" "}
					<Link
						href="/memberships"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
					>
						Abbonamenti
					</Link>{" "}
					o{" "}
					<Link
						href="/entrance-sets"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
					>
						Pacchetti ingressi
					</Link>
					.
				</p>
			}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => row.code}
					entityLabel="Prodotto"
					bulkDeleteRow={async (row) => {
						await deleteProduct({ code: row.code });
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...PRODUCT_FILTER_ALLOWLIST]}
					filterLabels={PRODUCT_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun prodotto"
							hint="Crea un Abbonamento o un Pacchetto ingressi: il Prodotto correlato compare qui."
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
