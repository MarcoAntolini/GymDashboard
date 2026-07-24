"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
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
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import {
	PURCHASE_LIST_DEFAULT_SORT,
	PURCHASE_LIST_FILTER_IDS,
	PURCHASE_LIST_SORT_COLUMNS,
} from "@/lib/domain/purchase-list-query";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
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
	{ id: "dateFrom", label: "Data da", placeholder: "AAAA-MM-GG" },
	{ id: "dateTo", label: "Data a", placeholder: "AAAA-MM-GG" },
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

	const [products, setProducts] = useState<PurchaseProductOption[]>([]);
	/** Local UI filter only — never written on Acquisto. */
	const [selectedKind, setSelectedKind] = useState<ProductKind>("Membership");
	const [filteredProducts, setFilteredProducts] = useState<PurchaseProductOption[]>([]);

	const loadList = useCallback(
		() => listPurchases(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<PurchaseListResult>(loadList);

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
			title: "Nuovo Acquisto",
			icon: PlusCircle,
			dialogContent: (
				<>
					<p className="text-sm text-muted-foreground -mt-2 mb-1">
						L&apos;importo di default viene dal Listino dell&apos;anno della data di vendita;
						puoi modificarlo (sconto). Durata e N si congelano come snapshot alla vendita.
					</p>
					<CatalogAmountDefault />
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Cliente</FormLabel>
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
								<FormLabel>Data</FormLabel>
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
												{field.value ? format(field.value, "PPP") : <span>Scegli una data</span>}
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
						<label className="text-sm font-medium leading-none">Filtro tipo prodotto</label>
						<Select
							value={selectedKind}
							onValueChange={(value) => setSelectedKind(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Filtra per Abbonamento o Pacchetto" />
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
														? `Nessun prodotto ${PRODUCT_KIND_LABELS[selectedKind].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}
												{selectedKind === "Membership"
													? ` (${product.membership?.duration} gg)`
													: ` (${product.entranceSet?.entranceNumber} ingressi)`}
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
								<FormLabel>Importo (snapshot)</FormLabel>
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

	return (
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
					listStatus={listStatus}
					listError={listError}
					onRetry={retryList}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.acquisti}
				/>
			}
		/>
	);
}
