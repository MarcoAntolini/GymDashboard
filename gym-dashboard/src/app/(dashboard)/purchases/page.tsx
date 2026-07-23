"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCatalog } from "@/data-access/catalogs";
import { getAllProducts } from "@/data-access/products";
import {
	createPurchase,
	deletePurchase,
	editPurchase,
	listPurchases,
	type PurchaseDTO
} from "@/data-access/purchases";
import { useEntityList } from "@/hooks/useEntityList";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { formatDateIt } from "@/lib/format";
import {
	columns,
	formSchema,
	ProductKind,
	productKindLabel,
	ProductWithKind
} from "./columns";

function CatalogAmountDefault() {
	const form = useFormContext<z.infer<typeof formSchema>>();
	const date = form.watch("date");
	const productCode = form.watch("productCode");
	const [hint, setHint] = useState<string>(
		"L'importo è uno snapshot alla vendita. Di default usa il prezzo Listino dell'anno della data."
	);

	useEffect(() => {
		let cancelled = false;

		async function loadCatalogPrice() {
			if (!date || !productCode) {
				setHint(
					"L'importo è uno snapshot alla vendita. Di default usa il prezzo Listino dell'anno della data."
				);
				return;
			}

			const year = new Date(date).getFullYear();
			const catalog = await getCatalog(year, productCode);
			if (cancelled) return;

			if (!catalog) {
				setHint(
					`Nessun prezzo in Listino ${year} per ${productCode}. Inserisci l'importo snapshot manualmente.`
				);
				return;
			}

			form.setValue("amount", catalog.price.toFixed(2), { shouldValidate: true });
			setHint(
				`Precompilato dal Listino ${year} (€ ${catalog.price.toFixed(2)}). Puoi scontare esplicitamente: resta lo snapshot sull'Acquisto.`
			);
		}

		void loadCatalogPrice();
		return () => {
			cancelled = true;
		};
	}, [date, productCode, form]);

	return (
		<div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-pretty text-muted-foreground">
			{hint}
		</div>
	);
}

export default function PurchasesPage() {
	const {
		data: purchases,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete,
		handleEdit
	} = useEntityList<PurchaseDTO, "id">(
		useMemo(
			() => ({
				list: listPurchases,
				deleteAction: deletePurchase,
				editAction: editPurchase
			}),
			[]
		),
		["id"]
	);

	const [products, setProducts] = useState<ProductWithKind[]>([]);
	const [selectedType, setSelectedType] = useState<ProductKind>(ProductKind.Membership);
	const [filteredProducts, setFilteredProducts] = useState<ProductWithKind[]>([]);

	useEffect(() => {
		const loadProducts = async () => {
			const allProducts = (await getAllProducts()) as ProductWithKind[];
			setProducts(allProducts);
			const filtered = allProducts.filter((product) =>
				selectedType === ProductKind.Membership ? product.membership : product.entranceSet
			);
			setFilteredProducts(filtered);
		};
		void loadProducts();
	}, []);

	useEffect(() => {
		const filtered = products.filter((product) =>
			selectedType === ProductKind.Membership ? product.membership : product.entranceSet
		);
		setFilteredProducts(filtered);
	}, [selectedType, products]);

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createPurchase(values);
			await refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Nuovo Acquisto",
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
								{field.value instanceof Date ? (
									<p className="text-sm text-muted-foreground tabular-nums">
										Anno Listino di riferimento: {field.value.getFullYear()}
									</p>
								) : null}
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Selettore tipo: solo filtro UI su Prodotti (membership XOR entranceSet) */}
					<div className="flex flex-col gap-2">
						<Label>Tipo</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(ProductKind) as ProductKind[]).map((type) => (
									<SelectItem key={type} value={type}>
										{productKindLabel[type]}
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
														? `Nessun prodotto ${productKindLabel[selectedType].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}{" "}
												{selectedType === ProductKind.Membership
													? `(${product.membership?.duration} giorni)`
													: `(${product.entranceSet?.entranceNumber} ingressi)`}
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
										type="number"
										step="0.01"
										{...field}
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
					productCode: ""
				},
				submitAction: handleCreatePurchase
			} as FormData<typeof formSchema>
		}
	];

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Acquisto">
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit, filteredProducts, selectedType, setSelectedType)}
						data={purchases}
						entityLabel="Acquisto"
						filters={["client", "productCode"]}
						facetedFilters={["kind"]}
						filterLabels={{
							client: "Cliente",
							productCode: "Prodotto",
							kind: "Tipo",
							date: "Data",
							amount: "Importo",
							capabilitySnapshot: "Durata / N",
							remainingEntrances: "Ingressi rimanenti",
							id: "ID"
						}}
						server={{
							query,
							onQueryChange: setQuery,
							total,
							facetOptions: facets
						}}
					/>
				}
			/>
		</EntityShell>
	);
}
