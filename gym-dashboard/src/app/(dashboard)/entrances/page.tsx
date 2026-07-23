"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllClients } from "@/data-access/clients";
import {
	AggregatedEntrances,
	createEntrance,
	deleteEntrance,
	editEntrance,
	EntranceAggregationGranularity,
	EntranceWithPurchase,
	getEntrancesAggregated,
	listEntrances
} from "@/data-access/entrances";
import { useEntityList } from "@/hooks/useEntityList";
import { cn } from "@/lib/utils";
import { Client } from "@prisma/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BarChart as BarChartIcon, CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { columns, formSchema } from "./columns";
import { EntranceJustificationPreviewField } from "./entrance-justification-preview";

const GRANULARITY_LABELS: Record<EntranceAggregationGranularity, string> = {
	daily: "Giornaliero",
	weekly: "Settimanale",
	monthly: "Mensile",
	yearly: "Annuale"
};

const analyticsFormSchema = z.object({
	granularity: z.enum(["daily", "weekly", "monthly", "yearly"]),
	date: z.object({
		from: z.date(),
		to: z.date()
	})
});

export default function EntrancesPage() {
	const {
		data: entrances,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete
	} = useEntityList<EntranceWithPurchase, "id">(
		useMemo(
			() => ({
				list: listEntrances,
				deleteAction: async (entity) => {
					await deleteEntrance({ id: entity.id });
					return entity as EntranceWithPurchase;
				}
			}),
			[]
		),
		["id"]
	);

	const [clients, setClients] = useState<Client[]>([]);
	const [isAnalyticsSheetOpen, setIsAnalyticsSheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
	const [selectedGranularity, setSelectedGranularity] =
		useState<EntranceAggregationGranularity>("daily");
	const [analyticsData, setAnalyticsData] = useState<AggregatedEntrances[]>([]);

	useEffect(() => {
		void getAllClients().then(setClients);
	}, []);

	const handleCreateEntrance = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newEntrance = await createEntrance(values);
			await refetch();
			const code =
				newEntrance.purchase?.productCode ?? newEntrance.purchase?.prodotto?.code ?? "";
			const kind =
				newEntrance.purchase?.membershipDuration != null
					? "Abbonamento"
					: newEntrance.purchase?.entranceNumber != null
						? "Pacchetto"
						: newEntrance.purchase?.prodotto?.membership
							? "Abbonamento"
							: newEntrance.purchase?.prodotto?.entranceSet
								? "Pacchetto"
								: "Acquisto";
			toast.success(
				`Ingresso registrato · giustificato da Acquisto #${newEntrance.purchaseId}${
					code ? ` (${kind} ${code})` : ""
				}.`
			);
		},
		[refetch]
	);

	const handleEditEntrance = useCallback(
		async (entrance: EntranceWithPurchase) => {
			const saved = await editEntrance({ id: entrance.id, date: entrance.date });
			await refetch();
			toast.success(
				`Ingresso aggiornato · giustificato da Acquisto #${saved.purchaseId}.`
			);
		},
		[refetch]
	);

	const handleAnalytics = useCallback(async (values: z.infer<typeof analyticsFormSchema>) => {
		setSelectedDateRange(values.date);
		setSelectedGranularity(values.granularity);
		const stats = await getEntrancesAggregated(
			values.date.from,
			values.date.to,
			values.granularity
		);
		setAnalyticsData(stats);
		setIsAnalyticsSheetOpen(true);
	}, []);

	const analyticsFormData: FormData<typeof analyticsFormSchema> = {
		formSchema: analyticsFormSchema,
		defaultValues: {
			granularity: "daily",
			date: {
				from: new Date(),
				to: new Date()
			}
		},
		submitAction: handleAnalytics
	};

	const actions: Action[] = [
		{
			title: "Registra Ingresso",
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
											<SelectValue placeholder="Seleziona un Cliente" />
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
								<FormLabel>Data e ora</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<EntranceJustificationPreviewField />
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					clientId: 0,
					date: new Date()
				},
				submitAction: handleCreateEntrance
			}
		},
		{
			title: "Analisi Ingressi",
			icon: BarChartIcon,
			variant: "outline",
			dialogContent: <AnalyticsFormFields />,
			formData: analyticsFormData
		}
	];

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Ingresso">
			<>
				<Dashboard
					actions={actions}
					table={
						<DataTable
							columns={columns(handleDelete, handleEditEntrance)}
							data={entrances}
							entityLabel="Ingresso"
							filters={["client", "product"]}
							facetedFilters={["product"]}
							filterLabels={{
								client: "Cliente",
								product: "Prodotto",
								date: "Data e ora",
								purchase: "Acquisto",
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
				<Sheet open={isAnalyticsSheetOpen} onOpenChange={setIsAnalyticsSheetOpen}>
					<SheetContent side="bottom" className="h-[450px]">
						<SheetHeader>
							<SheetTitle>
								Analisi Ingressi — {GRANULARITY_LABELS[selectedGranularity]}
							</SheetTitle>
							<SheetDescription>
								{selectedDateRange &&
									`Periodo: ${format(selectedDateRange.from, "dd/MM/yyyy")} – ${format(
										selectedDateRange.to,
										"dd/MM/yyyy"
									)}`}
							</SheetDescription>
						</SheetHeader>
						<div className="mt-4 h-[350px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={analyticsData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="period" />
									<YAxis allowDecimals={false} />
									<Tooltip
										formatter={(value) => [value as number, "Ingressi"]}
										labelFormatter={(label) => `Periodo: ${label}`}
									/>
									<Bar
										dataKey="totalEntrances"
										name="Ingressi"
										fill="#3b82f6"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</SheetContent>
				</Sheet>
			
			</>
		</EntityShell>
	);
}

function AnalyticsFormFields() {
	return (
		<>
			<FormField
				name="granularity"
				render={({ field }) => (
					<FormItem className="flex w-full flex-col gap-2">
						<FormLabel>Tipo di aggregazione</FormLabel>
						<Select value={field.value} onValueChange={field.onChange}>
							<FormControl>
								<SelectTrigger className="w-[300px]">
									<SelectValue placeholder="Seleziona granularità" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="daily">{GRANULARITY_LABELS.daily}</SelectItem>
								<SelectItem value="weekly">{GRANULARITY_LABELS.weekly}</SelectItem>
								<SelectItem value="monthly">{GRANULARITY_LABELS.monthly}</SelectItem>
								<SelectItem value="yearly">{GRANULARITY_LABELS.yearly}</SelectItem>
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
													{format(field.value.from, "dd/MM/yyyy")} –{" "}
													{format(field.value.to, "dd/MM/yyyy")}
												</>
											) : (
												format(field.value.from, "dd/MM/yyyy")
											)
										) : (
											<span>Scegli un intervallo di date</span>
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
									locale={it}
								/>
							</PopoverContent>
						</Popover>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
