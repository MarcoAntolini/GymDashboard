"use client";

import { purchaseTypes } from "@/components/ui/domain-badge";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	createCatalog,
	deleteCatalog,
	editCatalog,
	listCatalogs,
	type CatalogDTO,
} from "@/data-access/catalogs";
import { getAllProducts, type ProductDTO } from "@/data-access/products";
import { useEntityList } from "@/hooks/useEntityList";
import type { PurchaseType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function CatalogsPage() {
	const {
		data: catalogs,
		total,
		facets,
		query,
		setQuery,
		handleDelete,
		handleEdit,
		refetch,
	} = useEntityList<CatalogDTO, "year" | "type" | "productCode">(
		useMemo(
			() => ({
				list: listCatalogs,
				deleteAction: deleteCatalog,
				editAction: editCatalog,
			}),
			[]
		),
		["year", "type", "productCode"]
	);

	const [products, setProducts] = useState<ProductDTO[]>([]);
	const [selectedType, setSelectedType] = useState<PurchaseType>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([]);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = await getAllProducts();
			setProducts(allProducts);
			const filtered = allProducts.filter((product) =>
				selectedType === "Membership" ? product.membership : product.entranceSet
			);
			setFilteredProducts(filtered);
		};
		void loadProducts();
	}, []);

	useEffect(() => {
		const filtered = products.filter((product) =>
			selectedType === "Membership" ? product.membership : product.entranceSet
		);
		setFilteredProducts(filtered);
	}, [selectedType, products]);

	const handleCreateCatalog = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createCatalog(values);
			await refetch();
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
					<FormField
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value);
										setSelectedType(value as PurchaseType);
									}}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{purchaseTypes.map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
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
														? `No ${selectedType.toLowerCase()} products available`
														: "Select a product"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedType === "Membership"
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
										type="number"
										step="0.01"
										{...field}
										onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
					type: "Membership",
					productCode: "",
					price: 0,
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
					data={catalogs}
					filters={["productCode"]}
					facetedFilters={["year", "type"]}
					server={{
						query,
						onQueryChange: setQuery,
						total,
						facetOptions: facets,
					}}
				/>
			}
		/>
	);
}
