"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
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

	const [result, setResult] = useState<CatalogListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [products, setProducts] = useState<CatalogProductOption[]>([]);
	/** Local UI filter only — never written on Listino. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<CatalogProductOption[]>([]);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listCatalogs(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

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
			title: "Add to Catalog",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="year"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Year</FormLabel>
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
						<label className="text-sm font-medium leading-none">Type</label>
						<Select
							value={selectedKind}
							onValueChange={(value) => setSelectedKind(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a type" />
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
								<FormLabel>Product</FormLabel>
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
														? `No ${PRODUCT_KIND_LABELS[selectedKind].toLowerCase()} products available`
														: "Select a product"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedKind === "Membership"
													? `(${product.membership?.duration} days)`
													: `(${product.entranceSet?.entranceNumber} entrances)`}
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
								<FormLabel>Price</FormLabel>
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

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
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
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.listino}
				/>
			}
		/>
	);
}
