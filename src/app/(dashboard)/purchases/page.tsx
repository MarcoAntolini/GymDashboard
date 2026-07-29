"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { TableErrorState } from "@/components/ui/data-table/table-error-state";
import { TableLoadingState } from "@/components/ui/data-table/table-loading-state";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllProducts } from "@/data-access/products";
import {
	createPurchase,
	deletePurchase,
	editPurchase,
	getEntrateByPeriod,
	listPurchases,
	type EntratePeriodPoint,
} from "@/data-access/purchases";
import { useServerList } from "@/hooks/useServerList";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import { formatDateIt, formatEur } from "@/lib/format";
import {
	PERIOD_TYPE_LABELS,
	PERIOD_TYPES,
	type PeriodType,
} from "@/lib/period-aggregation";
import {
	PURCHASE_DEFAULT_SORT,
	PURCHASE_FILTER_ALLOWLIST,
	PURCHASE_FILTER_LABELS,
	PURCHASE_SORT_ALLOWLIST,
} from "@/lib/list/purchases";
import { cn } from "@/lib/utils";
import { BarChart as BarChartIcon, CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { CatalogAmountDefault } from "./catalog-amount-default";
import { columns, formSchema, ProductWithSpec, PurchaseRow } from "./columns";

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
	periodType: z.enum(PERIOD_TYPES),
});

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
	const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(
		null
	);
	const [periodType, setPeriodType] = useState<PeriodType>("monthly");
	const [analyticsData, setAnalyticsData] = useState<EntratePeriodPoint[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [analyticsError, setAnalyticsError] = useState<string | null>(null);

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

	const loadEntrateAnalytics = useCallback(
		async (from: Date, to: Date, type: PeriodType) => {
			setAnalyticsLoading(true);
			setAnalyticsError(null);
			try {
				const points = await getEntrateByPeriod(from, to, type);
				setAnalyticsData(points);
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile caricare l'analisi entrate.";
				setAnalyticsError(message);
				setAnalyticsData([]);
			} finally {
				setAnalyticsLoading(false);
			}
		},
		[]
	);

	const handleAnalytics = useCallback(
		async (values: z.infer<typeof analyticsFormSchema>) => {
			setSelectedDateRange(values.date);
			setPeriodType(values.periodType);
			setIsAnalyticsOpen(true);
			await loadEntrateAnalytics(values.date.from, values.date.to, values.periodType);
		},
		[loadEntrateAnalytics]
	);

	const handlePeriodTypeChange = useCallback(
		(next: PeriodType) => {
			setPeriodType(next);
			if (!selectedDateRange) return;
			void loadEntrateAnalytics(selectedDateRange.from, selectedDateRange.to, next);
		},
		[loadEntrateAnalytics, selectedDateRange]
	);

	const hasEntrate = analyticsData.some((point) => point.totalAmount > 0 || point.count > 0);

	const analyticsFormData: FormData<typeof analyticsFormSchema> = {
		formSchema: analyticsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date(),
			},
			periodType: "monthly",
		},
		submitAction: handleAnalytics,
	};

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
		{
			title: "Analisi entrate",
			description:
				"Aggrega gli Acquisti (entrate da Clienti) per granularità di periodo: giornaliero, settimanale, mensile o annuale.",
			icon: BarChartIcon,
			dialogContent: (
				<>
					<FormField
						name="periodType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tipo periodo</FormLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleziona granularità" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{PERIOD_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{PERIOD_TYPE_LABELS[type]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="date"
						render={({ field }) => (
							<FormItem className="w-full flex flex-col gap-2">
								<FormLabel>Seleziona periodo</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn(
													"w-[300px] justify-start text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{field.value?.from ? (
													field.value.to ? (
														<>
															{formatDateIt(field.value.from)} -{" "}
															{formatDateIt(field.value.to)}
														</>
													) : (
														formatDateIt(field.value.from)
													)
												) : (
													<span>Seleziona un intervallo di date</span>
												)}
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											initialFocus
											mode="range"
											defaultMonth={field.value?.from}
											selected={field.value}
											onSelect={field.onChange}
											numberOfMonths={2}
										/>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: analyticsFormData,
		},
	];

	return (
		<>
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit, products)}
						getRowId={(row) => String(row.id)}
						entityLabel="Acquisto"
						bulkDeleteRow={async (row) => {
							await deletePurchase({ id: row.id });
						}}
						onBulkComplete={refetch}
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
			<Sheet open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
				<SheetContent side="bottom" className="h-[480px]">
					<SheetHeader>
						<SheetTitle>Analisi entrate</SheetTitle>
						<SheetDescription>
							{selectedDateRange
								? `Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)} · ${PERIOD_TYPE_LABELS[periodType]}`
								: "Importi Acquisto aggregati per tipo periodo"}
						</SheetDescription>
					</SheetHeader>
					<div className="mt-3 flex items-center gap-3">
						<Label htmlFor="entrate-period-type" className="shrink-0">
							Tipo periodo
						</Label>
						<Select
							value={periodType}
							onValueChange={(value) => handlePeriodTypeChange(value as PeriodType)}
							disabled={analyticsLoading || !selectedDateRange}
						>
							<SelectTrigger id="entrate-period-type" className="w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PERIOD_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{PERIOD_TYPE_LABELS[type]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="mt-4 h-[320px]">
						{analyticsLoading ? (
							<TableLoadingState />
						) : analyticsError ? (
							<TableErrorState
								message={analyticsError}
								onRetry={() => {
									if (!selectedDateRange) return;
									void loadEntrateAnalytics(
										selectedDateRange.from,
										selectedDateRange.to,
										periodType
									);
								}}
							/>
						) : !hasEntrate ? (
							<TableEmptyState
								title="Nessuna entrata nel periodo"
								hint="Registra un Acquisto oppure amplia l'intervallo di date."
							/>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={analyticsData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} />
									<YAxis
										tickFormatter={(value: number) =>
											new Intl.NumberFormat("it-IT", {
												notation: "compact",
												compactDisplay: "short",
											}).format(value)
										}
									/>
									<Tooltip
										formatter={(value) => [
											formatEur(typeof value === "number" ? value : Number(value ?? 0)),
											"Entrate",
										]}
										labelFormatter={(label) => String(label)}
									/>
									<Bar
										dataKey="totalAmount"
										name="Entrate"
										fill="#3b82f6"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
