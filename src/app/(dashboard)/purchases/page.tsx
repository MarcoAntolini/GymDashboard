"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllProducts } from "@/data-access/products";
import {
	createPurchase,
	deletePurchase,
	editPurchase,
	getAllPurchases,
} from "@/data-access/purchases";
import { useEntityData } from "@/hooks/useEntityData";
import {
	PRODUCT_KIND_LABELS,
	PRODUCT_KINDS,
	productMatchesKind,
	type ProductKind,
} from "@/lib/domain/product-kind";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogAmountDefault } from "./catalog-amount-default";
import { columns, formSchema, PurchaseProductOption, PurchaseRow } from "./columns";

export default function PurchasesPage() {
	const {
		data: purchases,
		setData: setPurchases,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<PurchaseRow, "id">(
		useMemo(
			() => ({
				getAll: getAllPurchases,
				deleteAction: (async ({ id }: { id: number }) => {
					await deletePurchase({ id });
					return { id } as unknown as PurchaseRow;
				}) as (entity: Pick<PurchaseRow, "id">) => Promise<PurchaseRow>,
				editAction: async (entity: PurchaseRow) => {
					await editPurchase({
						id: entity.id,
						clientId: entity.clientId,
						date: entity.date,
					});
					return entity;
				},
			}),
			[]
		),
		["id"]
	);

	const [products, setProducts] = useState<PurchaseProductOption[]>([]);
	/** Local UI filter only — never written on Acquisto. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<PurchaseProductOption[]>([]);

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

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newPurchase = await createPurchase(values);
			setPurchases((prevPurchases) => [...prevPurchases, newPurchase]);
		},
		[setPurchases]
	);

	const actions: Action[] = [
		{
			title: "Add Purchase",
			icon: PlusCircle,
			dialogContent: (
				<>
					<CatalogAmountDefault />
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Client ID</FormLabel>
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
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn(
													"w-full pl-3 text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={field.onChange}
											disabled={(date) => date < new Date("1900-01-01")}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Tipo: UI-only product filter — not a FormField / not in formSchema */}
					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">Product type filter</label>
						<Select
							value={selectedKind}
							onValueChange={(value) => setSelectedKind(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Filter products by type" />
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
												{product.code}
												{selectedKind === "Membership"
													? ` (${product.membership?.duration} days)`
													: ` (${product.entranceSet?.entranceNumber} entrances)`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Amount</FormLabel>
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
					clientId: 0,
					date: new Date(),
					amount: "",
					productCode: "",
				},
				submitAction: handleCreatePurchase,
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
					data={purchases}
					filters={["clientId", "productCode"]}
					facetedFilters={[]}
				/>
			}
		/>
	);
}
