"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	CatalogRow,
	createCatalog,
	deleteCatalog,
	editCatalog,
	listCatalogs,
	type CatalogListResult,
} from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import {
	CATALOG_LIST_DEFAULT_SORT,
	CATALOG_LIST_FILTER_IDS,
	CATALOG_LIST_SORT_COLUMNS,
} from "@/lib/domain/catalog-list-query";
import {
	PRODUCT_KIND_LABELS,
	PRODUCT_KINDS,
	productMatchesKind,
	type ProductKind,
} from "@/lib/domain/product-kind";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogProductOption, columns, formSchema } from "./columns";

const CATALOG_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "year", label: "Anno", placeholder: "Anno" },
	{ id: "productCode", label: "Codice prodotto", placeholder: "Codice prodotto" },
];

const EMPTY_FILTERS = Object.fromEntries(
	CATALOG_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof CATALOG_LIST_FILTER_IDS)[number], string>;

export default function CatalogsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: CATALOG_LIST_SORT_COLUMNS,
		defaultSort: CATALOG_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [products, setProducts] = useState<CatalogProductOption[]>([]);
	/** Local UI filter only — never written on Listino. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<CatalogProductOption[]>([]);

	const loadList = useCallback(
		() => listCatalogs(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<CatalogListResult>(loadList);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = await getAllProducts();
			setProducts(allProducts);
		};
		loadProducts();
	}, []);

	useEffect(() => {
		setFilteredProducts(
			products.filter((product) => productMatchesKind(product, selectedKind))
		);
	}, [selectedKind, products]);

	const handleDelete = useCallback(
		async (catalog: Pick<CatalogRow, "year" | "productCode">) => {
			await deleteCatalog(catalog);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (catalog: CatalogRow) => {
			await editCatalog({
				year: catalog.year,
				productCode: catalog.productCode,
				price: catalog.price,
			});
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateCatalog = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createCatalog(values);
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
			title: "Aggiungi al Listino",
			icon: PlusCircle,
			dialogContent: (
				<>
					<p className="text-sm text-muted-foreground -mt-2 mb-1">
						Il prezzo per anno e prodotto propone l&apos;importo degli Acquisti venduti in
						quell&apos;anno; dopo la vendita l&apos;importo resta snapshot sull&apos;Acquisto.
					</p>
					<FormField
						name="year"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Anno</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) => field.onChange(parseInt(e.target.value))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Tipo: UI-only product filter — not a FormField / not in formSchema */}
					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">Filtro tipo</label>
						<Select
							value={selectedKind}
							onValueChange={(value) => setSelectedKind(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{PRODUCT_KINDS.map((kind) => (
									<SelectItem key={kind} value={kind}>
										{PRODUCT_KIND_LABELS[kind]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Prodotto</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={filteredProducts.length === 0}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={
													filteredProducts.length === 0
														? `Nessun prodotto ${PRODUCT_KIND_LABELS[selectedKind].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedKind === "Membership"
													? `(${product.membership?.duration} gg)`
													: `(${product.entranceSet?.entranceNumber} ingressi)`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Prezzo</FormLabel>
								<FormControl>
									<Input
										type="text"
										inputMode="decimal"
										placeholder="0.00"
										{...field}
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
					year: new Date().getFullYear(),
					productCode: "",
					price: "",
				},
				submitAction: handleCreateCatalog,
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
					filterFields={CATALOG_FILTER_FIELDS}
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
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.listino}
				/>
			}
		/>
	);
}
