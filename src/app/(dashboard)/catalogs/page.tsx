"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
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
					{/* Tipo: solo filtro UI locale — non e' FormField / non va nel payload Listino */}
					<div className="space-y-2">
						<Label>Type</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a type" />
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
														? `No ${PRODUCT_KIND_LABEL[selectedType].toLowerCase()} products available`
														: "Select a product"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedType === ProductKind.Membership
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

	return list.isLoading && list.items.length === 0 ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={list.items}
					filters={[...CATALOG_FILTER_ALLOWLIST]}
					filterLabels={CATALOG_FILTER_LABELS}
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
