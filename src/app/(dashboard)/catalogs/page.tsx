"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	CatalogRow,
	createCatalog,
	deleteCatalog,
	editCatalog,
	getAllCatalogs,
} from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import {
	PRODUCT_KIND_LABELS,
	PRODUCT_KINDS,
	productMatchesKind,
	type ProductKind,
} from "@/lib/domain/product-kind";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogProductOption, columns, formSchema } from "./columns";

export default function CatalogsPage() {
	const {
		data: catalogs,
		setData: setCatalogs,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<CatalogRow, "year" | "productCode">(
		useMemo(
			() => ({
				getAll: getAllCatalogs,
				deleteAction: (async ({
					year,
					productCode,
				}: Pick<CatalogRow, "year" | "productCode">) => {
					await deleteCatalog({ year, productCode });
					return { year, productCode } as CatalogRow;
				}) as (
					entity: Pick<CatalogRow, "year" | "productCode">
				) => Promise<CatalogRow>,
				editAction: async (entity: CatalogRow) => {
					await editCatalog({
						year: entity.year,
						productCode: entity.productCode,
						price: entity.price,
					});
					return entity;
				},
			}),
			[]
		),
		["year", "productCode"]
	);

	const [products, setProducts] = useState<CatalogProductOption[]>([]);
	/** Local UI filter only — never written on Listino. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<CatalogProductOption[]>([]);

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

	const handleCreateCatalog = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newCatalog = await createCatalog(values);
			setCatalogs((prevCatalogs) => [...prevCatalogs, newCatalog]);
		},
		[setCatalogs]
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

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={catalogs}
					filters={["year", "productCode"]}
					facetedFilters={["year", "productKind"]}
				/>
			}
		/>
	);
}
