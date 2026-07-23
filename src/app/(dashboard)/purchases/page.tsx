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
	PurchaseWithSnapshot,
} from "@/data-access/purchases";
import { useEntityData } from "@/hooks/useEntityData";
import { cn } from "@/lib/utils";
import { PurchaseType } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
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
				getAll: getAllPurchases as () => Promise<PurchaseRow[]>,
				deleteAction: (async ({ id }: { id: number }) => {
					await deletePurchase({ id });
					return { id } as PurchaseRow;
				}) as (entity: Pick<PurchaseRow, "id">) => Promise<PurchaseRow>,
				editAction: editPurchase as (entity: PurchaseRow) => Promise<PurchaseRow>,
			}),
			[]
		),
		["id"]
	);

	const [products, setProducts] = useState<PurchaseProductOption[]>([]);
	const [selectedType, setSelectedType] = useState<PurchaseType>(PurchaseType.Membership);
	const [filteredProducts, setFilteredProducts] = useState<PurchaseProductOption[]>([]);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = await getAllProducts();
			setProducts(allProducts);
			const filtered = allProducts.filter((product) =>
				selectedType === PurchaseType.Membership ? product.membership : product.entranceSet
			);
			setFilteredProducts(filtered);
		};
		loadProducts();
	}, []);

	useEffect(() => {
		const filtered = products.filter((product) =>
			selectedType === PurchaseType.Membership ? product.membership : product.entranceSet
		);
		setFilteredProducts(filtered);
	}, [selectedType, products]);

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newPurchase = (await createPurchase(values)) as PurchaseWithSnapshot;
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
					<FormField
						name="amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Amount</FormLabel>
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
					<FormItem>
						<FormLabel>Product type filter</FormLabel>
						<Select
							onValueChange={(value) => setSelectedType(value as PurchaseType)}
							defaultValue={selectedType}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Filter products by type" />
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
					</FormItem>
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
												{product.code}
												{selectedType === PurchaseType.Membership
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
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					clientId: 0,
					date: new Date(),
					amount: 0,
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
					columns={columns(
						handleDelete,
						handleEdit,
						filteredProducts,
						setSelectedType,
						selectedType
					)}
					data={purchases}
					filters={["clientId", "productCode"]}
					facetedFilters={[]}
				/>
			}
		/>
	);
}
