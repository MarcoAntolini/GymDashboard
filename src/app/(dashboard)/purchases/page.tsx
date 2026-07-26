"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllProducts } from "@/data-access/products";
import {
	createPurchase,
	deletePurchase,
	editPurchase,
	listPurchases,
} from "@/data-access/purchases";
import { useServerList } from "@/hooks/useServerList";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import {
	PURCHASE_DEFAULT_SORT,
	PURCHASE_FILTER_ALLOWLIST,
	PURCHASE_FILTER_LABELS,
	PURCHASE_SORT_ALLOWLIST,
} from "@/lib/list/purchases";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CatalogAmountDefault } from "./catalog-amount-default";
import { columns, formSchema, ProductWithSpec, PurchaseRow } from "./columns";

export default function PurchasesPage() {
	const list = useServerList<PurchaseRow>({
		list: listPurchases,
		sortAllowlist: PURCHASE_SORT_ALLOWLIST,
		filterAllowlist: PURCHASE_FILTER_ALLOWLIST,
		defaultSort: [...PURCHASE_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (purchase: Pick<PurchaseRow, "id">) => {
			await deletePurchase(purchase);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (purchase: PurchaseRow) => {
			const updated = await editPurchase({
				id: purchase.id,
				clientId: purchase.clientId,
				date: purchase.date,
				amount: purchase.amount,
				productCode: purchase.productCode,
			});
			setItems((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item))
			);
		},
		[setItems]
	);

	const [products, setProducts] = useState<ProductWithSpec[]>([]);
	const [selectedType, setSelectedType] = useState<ProductKind>(ProductKind.Membership);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = (await getAllProducts()) as ProductWithSpec[];
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

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createPurchase(values);
			refetch();
		},
		[refetch]
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
					{/* Tipo: solo filtro UI locale — non è FormField / non va nel payload Acquisto */}
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
												{product.code}
												{selectedType === ProductKind.Membership
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
										value={
											typeof field.value === "string"
												? field.value
												: String(field.value ?? "")
										}
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
					clientId: 0,
					date: new Date(),
					amount: "",
					productCode: "",
				},
				submitAction: handleCreatePurchase,
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
					columns={columns(handleDelete, handleEdit, products)}
					data={list.items}
					filters={[...PURCHASE_FILTER_ALLOWLIST]}
					filterLabels={PURCHASE_FILTER_LABELS}
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
