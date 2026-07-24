"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCatalog, deleteCatalog, editCatalog, getAllCatalogs } from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogRow, columns, formSchema } from "./columns";

type ProductOption = Awaited<ReturnType<typeof getAllProducts>>[number];

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
				deleteAction: async (key) => {
					await deleteCatalog(key);
					return key as CatalogRow;
				},
				editAction: async (catalog) =>
					editCatalog({
						year: catalog.year,
						productCode: catalog.productCode,
						price: catalog.price,
					}),
			}),
			[]
		),
		["year", "productCode"]
	);

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

	const handleCreateCatalog = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newCatalog = await createCatalog({
				year: values.year,
				productCode: values.productCode,
				price: values.price,
			});
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
					{/* Tipo: solo filtro UI locale — non è FormField / non va nel payload Listino */}
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
					facetedFilters={["year"]}
				/>
			}
		/>
	);
}
