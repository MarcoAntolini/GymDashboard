"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllClients } from "@/data-access/clients";
import {
	createEntrance,
	deleteEntrance,
	editEntrance,
	getDailyEntrances,
	getMonthlyEntrances,
	getWeeklyEntrances,
	listEntrances,
	type EntranceListResult,
	type EntranceRow,
} from "@/data-access/entrances";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	ENTRANCE_LIST_DEFAULT_SORT,
	ENTRANCE_LIST_FILTER_IDS,
	ENTRANCE_LIST_SORT_COLUMNS,
} from "@/lib/domain/entrance-list-query";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart as BarChartIcon, CalendarDays, CalendarIcon, Clock, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { ClientOption, columns, EditEntranceValues, formSchema } from "./columns";

const ENTRANCE_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "dateFrom", label: "Data da", placeholder: "AAAA-MM-GG" },
	{ id: "dateTo", label: "Data a", placeholder: "AAAA-MM-GG" },
	{ id: "clientSurname", label: "Cognome cliente", placeholder: "Cognome cliente" },
	{ id: "clientName", label: "Nome cliente", placeholder: "Nome cliente" },
	{ id: "productCode", label: "Codice prodotto", placeholder: "Codice prodotto" },
	{ id: "purchaseId", label: "ID acquisto", placeholder: "ID acquisto" },
];

const EMPTY_FILTERS = Object.fromEntries(
	ENTRANCE_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof ENTRANCE_LIST_FILTER_IDS)[number], string>;

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
});

export default function EntrancesPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: ENTRANCE_LIST_SORT_COLUMNS,
		defaultSort: ENTRANCE_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<EntranceListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [clients, setClients] = useState<ClientOption[]>([]);
	const [isWeeklySheetOpen, setIsWeeklySheetOpen] = useState(false);
	const [isDailySheetOpen, setIsDailySheetOpen] = useState(false);
	const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(
		null
	);
	const [dailyData, setDailyData] = useState<{ hourOfDay: string; totalEntrances: number }[]>([]);
	const [weeklyData, setWeeklyData] = useState<{ dayOfWeek: string; totalEntrances: number }[]>(
		[]
	);
	const [monthlyData, setMonthlyData] = useState<{ month: string; totalEntrances: number }[]>([]);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listEntrances(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	useEffect(() => {
		void getAllClients().then((rows) =>
			setClients(
				rows.map((client: { id: number; name: string; surname: string }) => ({
					id: client.id,
					name: client.name,
					surname: client.surname,
				}))
			)
		);
	}, []);

	const handleDelete = useCallback(
		async (entrance: Pick<EntranceRow, "id">) => {
			await deleteEntrance(entrance);
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateEntrance = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createEntrance(values);
			await fetchList();
		},
		[fetchList]
	);

	const handleEditEntrance = useCallback(
		async (values: EditEntranceValues) => {
			await editEntrance(values);
			await fetchList();
		},
		[fetchList]
	);

	const handleAnalytics = useCallback(
		async (values: z.infer<typeof analyticsFormSchema>, type: "weekly" | "daily" | "monthly") => {
			setSelectedDateRange(values.date);
			switch (type) {
				case "weekly": {
					const weeklyStats = await getWeeklyEntrances(values.date.from, values.date.to);
					setWeeklyData(weeklyStats);
					setIsWeeklySheetOpen(true);
					break;
				}
				case "daily": {
					const dailyStats = await getDailyEntrances(values.date.from, values.date.to);
					setDailyData(dailyStats);
					setIsDailySheetOpen(true);
					break;
				}
				case "monthly": {
					const monthlyStats = await getMonthlyEntrances(values.date.from, values.date.to);
					setMonthlyData(monthlyStats);
					setIsMonthlySheetOpen(true);
					break;
				}
			}
		},
		[]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEditEntrance, clients),
		[handleDelete, handleEditEntrance, clients]
	);

	const analyticsFormData: FormData<typeof analyticsFormSchema> = {
		formSchema: analyticsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date(),
			},
		},
		submitAction: (values) => handleAnalytics(values, "weekly"),
	};

	const actions: Action[] = [
		{
			title: "Registra Ingresso",
			icon: PlusCircle,
			dialogContent: (
				<>
					<p className="text-sm text-muted-foreground -mt-2 mb-1">
						L&apos;Acquisto giustificante si sceglie in automatico: Abbonamento valido più
						recente, altrimenti Pacchetto con residuo (FIFO). Se nessuno giustifica,
						vedrai un errore chiaro.
					</p>
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Cliente</FormLabel>
								<Select
									onValueChange={(value) => field.onChange(parseInt(value, 10))}
									value={field.value ? String(field.value) : undefined}
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
					clientId: clients[0]?.id ?? 0,
					date: new Date(),
				},
				submitAction: handleCreateEntrance,
			},
		},
		{
			title: "Analisi giornaliera",
			icon: Clock,
			dialogContent: <DateRangePickerField />,
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "daily"),
			},
		},
		{
			title: "Analisi settimanale",
			icon: CalendarDays,
			dialogContent: <DateRangePickerField />,
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "weekly"),
			},
		},
		{
			title: "Analisi mensile",
			icon: BarChartIcon,
			dialogContent: <DateRangePickerField />,
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "monthly"),
			},
		},
	];

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<>
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
						filterFields={ENTRANCE_FILTER_FIELDS}
						draftFilters={listQuery.draftFilters}
						onDraftFilterChange={listQuery.setDraftFilter}
						onApplyFilters={listQuery.applyFilters}
						onResetFilters={listQuery.resetFilters}
						isFilterDirty={listQuery.isFilterDirty}
						hasAppliedFilters={listQuery.hasAppliedFilters}
						emptyKind={result?.emptyKind ?? null}
						datasetEmptyMessage={DATASET_EMPTY_MESSAGES.ingressi}
					/>
				}
			/>
			<Sheet open={isDailySheetOpen} onOpenChange={setIsDailySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Analisi ingressi giornaliera</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Periodo: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="hourOfDay" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
			<Sheet open={isWeeklySheetOpen} onOpenChange={setIsWeeklySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Analisi ingressi settimanale</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Periodo: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={weeklyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="dayOfWeek" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
			<Sheet open={isMonthlySheetOpen} onOpenChange={setIsMonthlySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Analisi ingressi mensile</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Periodo: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={monthlyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

function DateRangePickerField() {
	return (
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
												{format(field.value.from, "LLL dd, y")} -{" "}
												{format(field.value.to, "LLL dd, y")}
											</>
										) : (
											format(field.value.from, "LLL dd, y")
										)
									) : (
										<span>Scegli un intervallo</span>
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
	);
}
