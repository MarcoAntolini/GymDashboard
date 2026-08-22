"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { TableErrorState } from "@/components/ui/data-table/table-error-state";
import { TableLoadingState } from "@/components/ui/data-table/table-loading-state";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
	createPayment,
	deletePayment,
	editPayment,
	getUsciteByPeriod,
	listPayments,
	type PaymentRow,
	type UscitePeriodPoint,
} from "@/data-access/payments";
import { useServerList } from "@/hooks/useServerList";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { formatDateIt, formatEur } from "@/lib/format";
import {
	PAYMENT_DEFAULT_SORT,
	PAYMENT_FACETED_FILTERS,
	PAYMENT_FILTER_ALLOWLIST,
	PAYMENT_SORT_ALLOWLIST,
	PAYMENT_FILTER_LABELS,
} from "@/lib/list/payments";
import {
	PERIOD_TYPE_LABELS,
	PERIOD_TYPES,
	type PeriodType,
} from "@/lib/period-aggregation";
import { cn } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { BarChart as BarChartIcon, CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { columns } from "./columns";

const paymentSchema = z.discriminatedUnion("type", [
	z.object({
		date: z.date(),
		amount: z.number(),
		type: z.literal(PaymentType.Salary),
		employeeId: z.number(),
	}),
	z.object({
		date: z.date(),
		amount: z.number(),
		type: z.literal(PaymentType.Bill),
		description: z.string(),
		provider: z.string(),
	}),
	z.object({
		date: z.date(),
		amount: z.number(),
		type: z.literal(PaymentType.Equipment),
		description: z.string(),
		provider: z.string(),
	}),
	z.object({
		date: z.date(),
		amount: z.number(),
		type: z.literal(PaymentType.Intervention),
		description: z.string(),
		maker: z.string(),
		startingTime: z.date(),
		endingTime: z.date(),
	}),
]);

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
	periodType: z.enum(PERIOD_TYPES),
});

export default function PaymentsPage() {
	const list = useServerList<PaymentRow>({
		list: listPayments,
		sortAllowlist: PAYMENT_SORT_ALLOWLIST,
		filterAllowlist: PAYMENT_FILTER_ALLOWLIST,
		defaultSort: [...PAYMENT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(
		null
	);
	const [periodType, setPeriodType] = useState<PeriodType>("monthly");
	const [analyticsData, setAnalyticsData] = useState<UscitePeriodPoint[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [analyticsError, setAnalyticsError] = useState<string | null>(null);

	const handleDelete = useCallback(
		async (payment: Pick<PaymentRow, "id">) => {
			await deletePayment(payment);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (payment: {
			id: number;
			date: Date;
			amount: PaymentRow["amount"] | number;
			type: PaymentType;
		}) => {
			const updated = await editPayment(payment);
			setItems((prev) =>
				prev.map((item) =>
					item.id === updated.id
						? {
								...item,
								date: updated.date,
								amount: updated.amount,
								type: updated.type,
							}
						: item
				)
			);
		},
		[setItems]
	);

	const handleCreatePayment = useCallback(
		async (values: z.infer<typeof paymentSchema>) => {
			await createPayment(values);
			refetch();
		},
		[refetch]
	);

	const loadUsciteAnalytics = useCallback(async (from: Date, to: Date, type: PeriodType) => {
		setAnalyticsLoading(true);
		setAnalyticsError(null);
		try {
			const points = await getUsciteByPeriod(from, to, type);
			setAnalyticsData(points);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: "Impossibile caricare l'analisi uscite.";
			setAnalyticsError(message);
			setAnalyticsData([]);
		} finally {
			setAnalyticsLoading(false);
		}
	}, []);

	const handleAnalytics = useCallback(
		async (values: z.infer<typeof analyticsFormSchema>) => {
			setSelectedDateRange(values.date);
			setPeriodType(values.periodType);
			setIsAnalyticsOpen(true);
			await loadUsciteAnalytics(values.date.from, values.date.to, values.periodType);
		},
		[loadUsciteAnalytics]
	);

	const handlePeriodTypeChange = useCallback(
		(next: PeriodType) => {
			setPeriodType(next);
			if (!selectedDateRange) return;
			void loadUsciteAnalytics(selectedDateRange.from, selectedDateRange.to, next);
		},
		[loadUsciteAnalytics, selectedDateRange]
	);

	const hasUscite = analyticsData.some((point) => point.totalAmount > 0 || point.count > 0);

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
			title: "Aggiungi pagamento",
			description:
				"Crea un Pagamento tipizzato (Stipendio, Bolletta, Attrezzatura o Intervento) con i dettagli della specializzazione.",
			icon: PlusCircle,
			dialogContent: (
				<>
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
											defaultMonth={field.value || new Date()}
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
								<FormLabel>Importo</FormLabel>
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
					<FormField
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tipo</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleziona tipo pagamento" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(PaymentType).map((type) => (
											<SelectItem key={type} value={type}>
												{PAYMENT_TYPE_LABEL[type]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="type"
						render={({ field }) => {
							const type = field.value as PaymentType;
							switch (type) {
								case PaymentType.Salary:
									return (
										<FormField
											name="employeeId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>ID Dipendente</FormLabel>
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
									);
								case PaymentType.Bill:
								case PaymentType.Equipment:
									return (
										<>
											<FormField
												name="description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descrizione</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="provider"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Fornitore</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									);
								case PaymentType.Intervention:
									return (
										<>
											<FormField
												name="description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descrizione</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="maker"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Produttore</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="startingTime"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Ora inizio</FormLabel>
														<DateTimePicker
															field={field}
															onChange={(date) => field.onChange(date)}
														/>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="endingTime"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Ora fine</FormLabel>
														<DateTimePicker
															field={field}
															onChange={(date) => field.onChange(date)}
														/>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									);
								default:
									return <></>;
							}
						}}
					/>
				</>
			),
			formData: {
				formSchema: z.object({
					date: z.date(),
					amount: z.number().min(0),
					type: z.enum([
						PaymentType.Salary,
						PaymentType.Bill,
						PaymentType.Equipment,
						PaymentType.Intervention,
					]),
					employeeId: z.number().optional(),
					description: z.string().optional(),
					provider: z.string().optional(),
					maker: z.string().optional(),
					startingTime: z.date().optional(),
					endingTime: z.date().optional(),
				}),
				defaultValues: {
					date: new Date(),
					amount: 0,
					type: PaymentType.Salary,
				},
				submitAction: handleCreatePayment,
			},
		},
		{
			title: "Analisi uscite",
			description:
				"Aggrega i Pagamenti (uscite tipizzate) per granularità di periodo: giornaliero, settimanale, mensile o annuale.",
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
							<FormItem className="flex w-full flex-col gap-2">
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
						columns={columns(handleDelete, handleEdit)}
						getRowId={(row) => String(row.id)}
						entityLabel="Pagamento"
						bulkDeleteRow={async (row) => {
							await deletePayment({ id: row.id });
						}}
						onBulkComplete={refetch}
						data={list.items}
						isLoading={list.isLoading}
						error={list.error}
						onRetry={list.refetch}
						filters={[...PAYMENT_FILTER_ALLOWLIST]}
						facetedFilters={PAYMENT_FACETED_FILTERS}
						filterLabels={PAYMENT_FILTER_LABELS}
						emptyState={
							<TableEmptyState
								title="Nessun pagamento"
								hint="Usa Aggiungi pagamento per registrare il primo Pagamento in uscita."
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
						<SheetTitle>Analisi uscite</SheetTitle>
						<SheetDescription>
							{selectedDateRange
								? `Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)} · ${PERIOD_TYPE_LABELS[periodType]}`
								: "Importi Pagamento aggregati per tipo periodo"}
						</SheetDescription>
					</SheetHeader>
					<div className="mt-3 flex items-center gap-3">
						<Label htmlFor="uscite-period-type" className="shrink-0">
							Tipo periodo
						</Label>
						<Select
							value={periodType}
							onValueChange={(value) => handlePeriodTypeChange(value as PeriodType)}
							disabled={analyticsLoading || !selectedDateRange}
						>
							<SelectTrigger id="uscite-period-type" className="w-[200px]">
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
									void loadUsciteAnalytics(
										selectedDateRange.from,
										selectedDateRange.to,
										periodType
									);
								}}
							/>
						) : !hasUscite ? (
							<TableEmptyState
								title="Nessuna uscita nel periodo"
								hint="Registra un Pagamento oppure amplia l'intervallo di date."
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
											"Uscite",
										]}
										labelFormatter={(label) => String(label)}
									/>
									<Bar
										dataKey="totalAmount"
										name="Uscite"
										fill="#ef4444"
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
