"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllProducts } from "@/data-access/products";
import {
	createPurchase,
	deletePurchase,
	editPurchase,
	listPurchases,
	type PurchaseListResult,
} from "@/data-access/purchases";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	PURCHASE_LIST_DEFAULT_SORT,
	PURCHASE_LIST_FILTER_IDS,
	PURCHASE_LIST_SORT_COLUMNS,
} from "@/lib/domain/purchase-list-query";
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

const PURCHASE_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "dateFrom", label: "Data da", placeholder: "Data da (YYYY-MM-DD)" },
	{ id: "dateTo", label: "Data a", placeholder: "Data a (YYYY-MM-DD)" },
	{ id: "clientId", label: "ID cliente", placeholder: "ID cliente" },
	{ id: "clientSurname", label: "Cognome cliente", placeholder: "Cognome cliente" },
	{ id: "clientName", label: "Nome cliente", placeholder: "Nome cliente" },
	{ id: "productCode", label: "Codice prodotto", placeholder: "Codice prodotto" },
];

const EMPTY_FILTERS = Object.fromEntries(
	PURCHASE_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof PURCHASE_LIST_FILTER_IDS)[number], string>;

export default function PurchasesPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: PURCHASE_LIST_SORT_COLUMNS,
		defaultSort: PURCHASE_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<PurchaseListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [products, setProducts] = useState<PurchaseProductOption[]>([]);
	/** Local UI filter only — never written on Acquisto. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<PurchaseProductOption[]>([]);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listPurchases(listQuery.input);
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
		void loadProducts();
	}, []);

	useEffect(() => {
		setFilteredProducts(
			products.filter((product) => productMatchesKind(product, selectedKind))
		);
	}, [selectedKind, products]);

	const handleDelete = useCallback(
		async (purchase: Pick<PurchaseRow, "id">) => {
			await deletePurchase(purchase);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (purchase: PurchaseRow) => {
			await editPurchase({
				id: purchase.id,
				clientId: purchase.clientId,
				date: purchase.date,
			});
			await fetchList();
		},
		[fetchList]
	);

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createPurchase(values);
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
					filterFields={PURCHASE_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage="Nessun acquisto registrato."
				/>
			}
		/>
	);
}
