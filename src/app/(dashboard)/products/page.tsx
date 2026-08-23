"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import {
	createProduct,
	deleteProduct,
	editProduct,
	listProducts,
} from "@/data-access/products";
import { useServerList } from "@/hooks/useServerList";
import {
	PRODUCT_DEFAULT_SORT,
	PRODUCT_FACETED_FILTERS,
	PRODUCT_FILTER_ALLOWLIST,
	PRODUCT_FILTER_LABELS,
	PRODUCT_SORT_ALLOWLIST,
} from "@/lib/list/products";
import { ProductKind } from "@/lib/domain/product-kind";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { columns, formSchema, type ProductRow } from "./columns";
import { ProductFormFields } from "./product-form-fields";

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
		async (product: z.infer<typeof formSchema>) => {
			const updated = await editProduct(product);
			setItems((prev) =>
				prev.map((item) =>
					item.code === updated.code ? updated : item
				)
			);
		},
		[setItems]
	);

	const handleCreate = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createProduct(values);
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi prodotto",
			description:
				"Definisci il prodotto e i dettagli specifici per Abbonamento o Pacchetto ingressi.",
			icon: PlusCircle,
			dialogContent: <ProductFormFields />,
			formData: {
				formSchema,
				defaultValues: {
					code: "",
					kind: ProductKind.Membership,
					description: "",
					detail: 30,
					active: true,
				},
				submitAction: handleCreate,
			} as FormData<typeof formSchema>,
		},
	];

	return (
		<Dashboard
			actions={actions}
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
					facetedFilters={[...PRODUCT_FACETED_FILTERS]}
					filterLabels={PRODUCT_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun prodotto"
							hint="Usa Aggiungi prodotto per creare un Abbonamento o un Pacchetto ingressi."
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
