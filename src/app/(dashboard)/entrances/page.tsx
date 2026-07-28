"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllClients } from "@/data-access/clients";
import {
	deleteEntrance,
	editEntrance,
	getDailyEntrances,
	getMonthlyEntrances,
	getWeeklyEntrances,
	listEntrances,
	registerEntrance,
	type EntranceRow,
} from "@/data-access/entrances";
import { useServerList } from "@/hooks/useServerList";
import {
	ENTRANCE_DEFAULT_SORT,
	ENTRANCE_FILTER_ALLOWLIST,
	ENTRANCE_FILTER_LABELS,
	ENTRANCE_SORT_ALLOWLIST,
} from "@/lib/list/entrances";
import { cn } from "@/lib/utils";
import { formatDateIt } from "@/lib/format";
import { BarChart as BarChartIcon, CalendarDays, CalendarIcon, Clock, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { ClientOption, columns, formSchema } from "./columns";

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
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
	const [isWeeklySheetOpen, setIsWeeklySheetOpen] = useState(false);
	const [isDailySheetOpen, setIsDailySheetOpen] = useState(false);
	const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
	const [dailyData, setDailyData] = useState<{ hourOfDay: string; totalEntrances: number }[]>([]);
	const [weeklyData, setWeeklyData] = useState<{ dayOfWeek: string; totalEntrances: number }[]>([]);
	const [monthlyData, setMonthlyData] = useState<{ month: string; totalEntrances: number }[]>([]);

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
			title: "Analisi giornaliera",
			icon: Clock,
			dialogContent: (
				<DateRangePickerField onSubmit={(values) => handleAnalytics(values, "daily")} formData={analyticsFormData} />
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "daily"),
			},
		},
		{
			title: "Analisi settimanale",
			icon: CalendarDays,
			dialogContent: (
				<DateRangePickerField onSubmit={(values) => handleAnalytics(values, "weekly")} formData={analyticsFormData} />
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "weekly"),
			},
		},
		{
			title: "Analisi mensile",
			icon: BarChartIcon,
			dialogContent: (
				<DateRangePickerField
					onSubmit={(values) => handleAnalytics(values, "monthly")}
					formData={analyticsFormData}
				/>
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "monthly"),
			},
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
			<Sheet open={isDailySheetOpen} onOpenChange={setIsDailySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Analisi ingressi giornaliera</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="hourOfDay" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" name="Ingressi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
								`Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={weeklyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="dayOfWeek" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" name="Ingressi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
								`Periodo: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={monthlyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" name="Ingressi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

function DateRangePickerField({
	onSubmit,
	formData,
}: {
	onSubmit: (values: z.infer<typeof analyticsFormSchema>) => void;
	formData: FormData<typeof analyticsFormSchema>;
}) {
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
												{formatDateIt(field.value.from)} - {formatDateIt(field.value.to)}
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
	);
}
