"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCatalog, deleteCatalog, editCatalog, getAllCatalogs } from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import { Catalog, Product, PurchaseType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function CatalogsPage() {
	const {
		data: catalogs,
		setData: setCatalogs,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Catalog, "year" | "type" | "productCode">(
		useMemo(
			() => ({
				getAll: getAllCatalogs,
				deleteAction: deleteCatalog,
				editAction: editCatalog
			}),
			[]
		),
		["year", "type", "productCode"]
	);

	const [products, setProducts] = useState<Product[]>([]);
	const [selectedType, setSelectedType] = useState<PurchaseType>(PurchaseType.Membership);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = await getAllProducts();
			setProducts(allProducts);
			// Initially filter for the default type (Membership)
			const filtered = allProducts.filter((product) =>
				selectedType === PurchaseType.Membership ? product.membership : product.entranceSet
			);
			setFilteredProducts(filtered);
		};
		loadProducts();
	}, []);

	// Update filtered products when type changes
	useEffect(() => {
		const filtered = products.filter((product) =>
			selectedType === PurchaseType.Membership ? product.membership : product.entranceSet
		);
		setFilteredProducts(filtered);
	}, [selectedType, products]);

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
									<Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
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
										{Object.values(PurchaseType).map((type) => (
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
								<Select onValueChange={field.onChange} value={field.value} disabled={filteredProducts.length === 0}>
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
												{selectedType === PurchaseType.Membership
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
					type: PurchaseType.Membership,
					productCode: "",
					price: 0
				},
				submitAction: handleCreateCatalog
			} as FormData<typeof formSchema>
		}
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
					filters={["year", "type", "productCode"]}
					facetedFilters={["year", "type"]}
				/>
			}
		/>
	);
}
