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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllClients } from "@/data-access/clients";
import {
	deleteEntrance,
	editEntrance,
	getEntranceFrequencyAndBancone,
	getEntrancesByPeriod,
	listEntrances,
	registerEntrance,
	type EntranceFrequencyBundle,
	type EntrancePeriodPoint,
	type EntranceRow,
} from "@/data-access/entrances";
import { useServerList } from "@/hooks/useServerList";
import {
	ENTRANCE_DEFAULT_SORT,
	ENTRANCE_FILTER_ALLOWLIST,
	ENTRANCE_FILTER_LABELS,
	ENTRANCE_SORT_ALLOWLIST,
} from "@/lib/list/entrances";
import { formatDateIt } from "@/lib/format";
import {
	PERIOD_TYPE_LABELS,
	PERIOD_TYPES,
	type PeriodType,
} from "@/lib/period-aggregation";
import { cn } from "@/lib/utils";
import { BarChart as BarChartIcon, CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { ClientOption, columns, formSchema } from "./columns";

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
	periodType: z.enum(PERIOD_TYPES),
});

export default function EntrancesPage() {
	const list = useServerList<EntranceRow>({
		list: listEntrances,
		sortAllowlist: ENTRANCE_SORT_ALLOWLIST,
		filterAllowlist: ENTRANCE_FILTER_ALLOWLIST,
		defaultSort: [...ENTRANCE_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (entrance: Pick<EntranceRow, "id">) => {
			await deleteEntrance(entrance);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (entrance: EntranceRow) => {
			const updated = await editEntrance({
				id: entrance.id,
				date: entrance.date,
			});
			setItems((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item))
			);
		},
		[setItems]
	);

	const [clients, setClients] = useState<ClientOption[]>([]);
	const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(
		null
	);
	const [periodType, setPeriodType] = useState<PeriodType>("weekly");
	const [analyticsData, setAnalyticsData] = useState<EntrancePeriodPoint[]>([]);
	const [frequencyBundle, setFrequencyBundle] = useState<EntranceFrequencyBundle | null>(null);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [analyticsError, setAnalyticsError] = useState<string | null>(null);

	useEffect(() => {
		void getAllClients().then((rows) =>
			setClients(rows.map((c) => ({ id: c.id, name: c.name, surname: c.surname })))
		);
	}, []);

	const handleCreateEntrance = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			try {
				await registerEntrance(values.clientId, values.date);
				refetch();
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile registrare l'ingresso.";
				toast.error(message);
				throw error;
			}
		},
		[refetch]
	);

	const loadEntranceAnalytics = useCallback(
		async (from: Date, to: Date, type: PeriodType) => {
			setAnalyticsLoading(true);
			setAnalyticsError(null);
			try {
				const [points, frequency] = await Promise.all([
					getEntrancesByPeriod(from, to, type),
					getEntranceFrequencyAndBancone(from, to),
				]);
				setAnalyticsData(points);
				setFrequencyBundle(frequency);
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile caricare l'analisi ingressi.";
				setAnalyticsError(message);
				setAnalyticsData([]);
				setFrequencyBundle(null);
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
			await loadEntranceAnalytics(values.date.from, values.date.to, values.periodType);
		},
		[loadEntranceAnalytics]
	);

	const handlePeriodTypeChange = useCallback(
		(next: PeriodType) => {
			setPeriodType(next);
			if (!selectedDateRange) return;
			void loadEntranceAnalytics(selectedDateRange.from, selectedDateRange.to, next);
		},
		[loadEntranceAnalytics, selectedDateRange]
	);

	const hasEntrances = analyticsData.some((point) => point.totalEntrances > 0);

	const analyticsFormData: FormData<typeof analyticsFormSchema> = {
		formSchema: analyticsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date(),
			},
			periodType: "weekly",
		},
		submitAction: handleAnalytics,
	};

	const actions: Action[] = [
		{
			title: "Registra ingresso",
			description:
				"L'Acquisto giustificatore è scelto automaticamente: priorità ad un Abbonamento valido alla data, altrimenti al Pacchetto con residuo (FIFO). Se nessun Acquisto copre la data, la registrazione fallisce con un messaggio chiaro.",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Cliente</FormLabel>
								<Select
									value={field.value ? String(field.value) : undefined}
									onValueChange={(value) => field.onChange(parseInt(value, 10))}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleziona cliente" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{clients.map((client) => (
											<SelectItem key={client.id} value={String(client.id)}>
												{client.surname} {client.name} (#{client.id})
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
							<FormItem>
								<FormLabel>Data</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
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
				},
				submitAction: handleCreateEntrance,
			},
		},
		{
			title: "Analisi ingressi",
			description:
				"Serie temporale Ingressi, picchi di affluenza (ora / weekday / mese) e carico bancone Ingressi + Acquisti per giorno.",
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
						columns={columns(handleDelete, handleEdit)}
						getRowId={(row) => String(row.id)}
						entityLabel="Ingresso"
						bulkDeleteRow={async (row) => {
							await deleteEntrance({ id: row.id });
						}}
						onBulkComplete={refetch}
						data={list.items}
						isLoading={list.isLoading}
						error={list.error}
						onRetry={list.refetch}
						filters={[...ENTRANCE_FILTER_ALLOWLIST]}
						filterLabels={ENTRANCE_FILTER_LABELS}
						emptyState={
							<TableEmptyState
								title="Nessun ingresso"
								hint="Usa Registra ingresso per aggiungere il primo Ingresso."
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
				<SheetContent side="bottom" className="h-[min(90vh,780px)] overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Analisi ingressi</SheetTitle>
						<SheetDescription>
							{selectedDateRange
								? `Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)} · ${PERIOD_TYPE_LABELS[periodType]}`
								: "Serie temporale, frequenza affluenza e carico bancone"}
						</SheetDescription>
					</SheetHeader>
					<div className="mt-3 flex items-center gap-3">
						<Label htmlFor="ingressi-period-type" className="shrink-0">
							Tipo periodo
						</Label>
						<Select
							value={periodType}
							onValueChange={(value) => handlePeriodTypeChange(value as PeriodType)}
							disabled={analyticsLoading || !selectedDateRange}
						>
							<SelectTrigger id="ingressi-period-type" className="w-[200px]">
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
					<div className="mt-4 h-[240px]">
						{analyticsLoading ? (
							<TableLoadingState />
						) : analyticsError ? (
							<TableErrorState
								message={analyticsError}
								onRetry={() => {
									if (!selectedDateRange) return;
									void loadEntranceAnalytics(
										selectedDateRange.from,
										selectedDateRange.to,
										periodType
									);
								}}
							/>
						) : !hasEntrances ? (
							<TableEmptyState
								title="Nessun ingresso nel periodo"
								hint="Registra un Ingresso oppure amplia l'intervallo di date."
							/>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={analyticsData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} />
									<YAxis allowDecimals={false} />
									<Tooltip />
									<Bar
										dataKey="totalEntrances"
										name="Ingressi"
										fill="#3b82f6"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</div>
					{!analyticsLoading && !analyticsError && frequencyBundle ? (
						<div className="mt-6 flex flex-col gap-6 pb-4">
							<div>
								<p className="mb-1 text-sm font-medium">Frequenza affluenza</p>
								<p className="mb-3 text-sm text-muted-foreground">
									Distribuzione Ingressi per ora, giorno della settimana e mese.
								</p>
								<div className="grid gap-4 md:grid-cols-3">
									<div className="h-[180px]">
										<p className="mb-1 text-xs font-medium text-muted-foreground">Ora</p>
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={frequencyBundle.byHour}>
												<XAxis dataKey="label" interval={3} tick={{ fontSize: 10 }} />
												<YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
												<Tooltip />
												<Bar dataKey="count" name="Ingressi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
									<div className="h-[180px]">
										<p className="mb-1 text-xs font-medium text-muted-foreground">
											Giorno settimana
										</p>
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={frequencyBundle.byWeekday}>
												<XAxis dataKey="label" tick={{ fontSize: 10 }} />
												<YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
												<Tooltip />
												<Bar dataKey="count" name="Ingressi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
									<div className="h-[180px]">
										<p className="mb-1 text-xs font-medium text-muted-foreground">Mese</p>
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={frequencyBundle.byMonth}>
												<XAxis dataKey="label" interval={1} tick={{ fontSize: 10 }} />
												<YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
												<Tooltip />
												<Bar dataKey="count" name="Ingressi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>
							<div>
								<p className="mb-1 text-sm font-medium">Carico bancone</p>
								<p className="mb-3 text-sm text-muted-foreground">
									Volume Ingressi e Acquisti per giorno nel periodo scelto.
								</p>
								<div className="h-[220px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={frequencyBundle.banconeDaily}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis
												dataKey="label"
												interval="preserveStartEnd"
												minTickGap={20}
												tick={{ fontSize: 10 }}
											/>
											<YAxis allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
											<Tooltip />
											<Legend />
											<Bar
												dataKey="ingressi"
												name="Ingressi"
												fill="#3b82f6"
												radius={[3, 3, 0, 0]}
											/>
											<Bar
												dataKey="acquisti"
												name="Acquisti"
												fill="#64748b"
												radius={[3, 3, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					) : null}
				</SheetContent>
			</Sheet>
		</>
	);
}
