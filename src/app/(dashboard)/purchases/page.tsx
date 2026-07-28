"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
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
import { formatDateIt } from "@/lib/format";
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
			title: "Aggiungi acquisto",
			description:
				"Importo, durata e N ingressi sono snapshot al momento della vendita. L'importo proposto viene dal Listino dell'anno della data (modificabile prima del salvataggio).",
			icon: PlusCircle,
			dialogContent: (
				<>
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
												{field.value ? formatDateIt(field.value) : <span>Scegli una data</span>}
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
						<Label>Tipo</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un tipo" />
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
														? `Nessun prodotto ${PRODUCT_KIND_LABEL[selectedType].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}
												{selectedType === ProductKind.Membership
													? ` (${product.membership?.duration} giorni)`
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

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit, products)}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...PURCHASE_FILTER_ALLOWLIST]}
					filterLabels={PURCHASE_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun acquisto"
							hint="Usa Aggiungi acquisto per registrare il primo Acquisto."
						/>
					}
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
						appliedFilters: list.query.filters,
					}}
				/>
			}
		/>
	);
}
