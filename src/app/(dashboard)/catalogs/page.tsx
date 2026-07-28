"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	createCatalog,
	deleteCatalog,
	editCatalog,
	listCatalogs,
} from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import { useServerList } from "@/hooks/useServerList";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import {
	CATALOG_DEFAULT_SORT,
	CATALOG_FILTER_ALLOWLIST,
	CATALOG_FILTER_LABELS,
	CATALOG_SORT_ALLOWLIST,
} from "@/lib/list/catalogs";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogRow, columns, formSchema } from "./columns";

type ProductOption = Awaited<ReturnType<typeof getAllProducts>>[number];

export default function CatalogsPage() {
	const list = useServerList<CatalogRow>({
		list: listCatalogs,
		sortAllowlist: CATALOG_SORT_ALLOWLIST,
		filterAllowlist: CATALOG_FILTER_ALLOWLIST,
		defaultSort: [...CATALOG_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const [products, setProducts] = useState<ProductOption[]>([]);
	const [selectedType, setSelectedType] = useState<ProductKind>(ProductKind.Membership);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = await getAllProducts();
			setProducts(allProducts);
		};
		loadProducts();
	}, []);

	const filteredProducts = useMemo(
		() =>
			products.filter((product) =>
				selectedType === ProductKind.Membership ? product.membership : product.entranceSet
			),
		[products, selectedType]
	);

	const handleDelete = useCallback(
		async (catalog: Pick<CatalogRow, "year" | "productCode">) => {
			await deleteCatalog(catalog);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (catalog: CatalogRow) => {
			const updated = await editCatalog({
				year: catalog.year,
				productCode: catalog.productCode,
				price: catalog.price,
			});
			setItems((prev) =>
				prev.map((item) =>
					item.year === updated.year && item.productCode === updated.productCode
						? updated
						: item
				)
			);
		},
		[setItems]
	);

	const handleCreateCatalog = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createCatalog({
				year: values.year,
				productCode: values.productCode,
				price: values.price,
			});
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi al listino",
			icon: PlusCircle,
			dialogContent: (
				<>
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
					{/* Tipo: solo filtro UI locale — non e' FormField / non va nel payload Listino */}
					<div className="space-y-2">
						<Label>Tipo</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(PRODUCT_KIND_LABEL) as ProductKind[]).map((kind) => (
									<SelectItem key={kind} value={kind}>
										{PRODUCT_KIND_LABEL[kind]}
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
														? `Nessun prodotto ${PRODUCT_KIND_LABEL[selectedType].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedType === ProductKind.Membership
													? `(${product.membership?.duration} giorni)`
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
										value={typeof field.value === "string" ? field.value : String(field.value ?? "")}
										onChange={(e) => field.onChange(e.target.value)}
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
					price: "0.00",
				},
				submitAction: handleCreateCatalog,
			} as FormData<typeof formSchema>,
		},
	];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => `${row.year}::${row.productCode}`}
					entityLabel="Listino"
					bulkDeleteRow={async (row) => {
						await deleteCatalog({
							year: row.year,
							productCode: row.productCode,
						});
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...CATALOG_FILTER_ALLOWLIST]}
					filterLabels={CATALOG_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessuna voce di listino"
							hint="Usa Aggiungi al listino per impostare il primo prezzo annuale."
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
