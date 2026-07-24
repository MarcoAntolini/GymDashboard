"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DotBadge } from "@/components/ui/domain-badge";
import Dashboard, { Action } from "@/components/ui/dashboard";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	createPayment,
	deletePayment,
	editPayment,
	listPayments,
	type PaymentListResult,
	type PaymentRow,
} from "@/data-access/payments";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { useEntityListFetch } from "@/hooks/useEntityListFetch";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import {
	PAYMENT_LIST_DEFAULT_SORT,
	PAYMENT_LIST_FILTER_IDS,
	PAYMENT_LIST_SORT_COLUMNS,
} from "@/lib/domain/payment-list-query";
import { paymentTypeChip } from "@/lib/format/domain-visuals";
import { formatDateIt } from "@/lib/format/locale";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { cn } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns } from "./columns";

const moneyAmount = z
	.string()
	.min(1, "Importo obbligatorio")
	.refine(isValidCatalogPriceString, {
		message: "Importo positivo con al massimo 2 decimali",
	});

const paymentSchema = z.discriminatedUnion("type", [
	z.object({
		date: z.date(),
		amount: moneyAmount,
		type: z.literal(PaymentType.Salary),
		employeeId: z.number(),
	}),
	z.object({
		date: z.date(),
		amount: moneyAmount,
		type: z.literal(PaymentType.Bill),
		description: z.string(),
		provider: z.string(),
	}),
	z.object({
		date: z.date(),
		amount: moneyAmount,
		type: z.literal(PaymentType.Equipment),
		description: z.string(),
		provider: z.string(),
	}),
	z.object({
		date: z.date(),
		amount: moneyAmount,
		type: z.literal(PaymentType.Intervention),
		description: z.string(),
		maker: z.string(),
		startingTime: z.date(),
		endingTime: z.date(),
	}),
]);

const PAYMENT_FILTER_FIELDS: ServerListFilterField[] = [
	{
		id: "type",
		label: "Tipo",
		placeholder: "Tipo (Stipendio/Bolletta/…)",
	},
];

const EMPTY_FILTERS = Object.fromEntries(
	PAYMENT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof PAYMENT_LIST_FILTER_IDS)[number], string>;

export default function PaymentsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: PAYMENT_LIST_SORT_COLUMNS,
		defaultSort: PAYMENT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const loadList = useCallback(
		() => listPayments(listQuery.input),
		[listQuery.input]
	);
	const {
		result,
		status: listStatus,
		error: listError,
		retry: retryList,
		refresh: fetchList,
	} = useEntityListFetch<PaymentListResult>(loadList);

	const handleDelete = useCallback(
		async (payment: Pick<PaymentRow, "id">) => {
			await deletePayment(payment);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (payment: PaymentRow) => {
			await editPayment({
				id: payment.id,
				date: payment.date,
				amount: payment.amount,
				type: payment.type,
			});
			await fetchList();
		},
		[fetchList]
	);

	const handleCreatePayment = useCallback(
		async (values: z.infer<typeof paymentSchema>) => {
			await createPayment(values);
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
			title: "Nuovo Pagamento",
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
												className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
										type="text"
										inputMode="decimal"
										className="text-right tabular-nums"
										{...field}
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
											<SelectValue placeholder="Seleziona tipo Pagamento" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={PaymentType.Salary}>Stipendio</SelectItem>
										<SelectItem value={PaymentType.Bill}>Bolletta</SelectItem>
										<SelectItem value={PaymentType.Equipment}>Attrezzatura</SelectItem>
										<SelectItem value={PaymentType.Intervention}>Intervento</SelectItem>
									</SelectContent>
								</Select>
								{field.value ? (
									<div className="pt-1">
										<DotBadge {...paymentTypeChip(field.value as PaymentType)} />
									</div>
								) : null}
								<p className="text-sm text-muted-foreground">
									La specializzazione (Dipendente, fornitore, intervento, …) è obbligatoria
									in creazione e resta ispezionabile in lista.
								</p>
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
														<FormLabel>Esecutore</FormLabel>
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
														<FormLabel>Inizio</FormLabel>
														<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="endingTime"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Fine</FormLabel>
														<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
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
					amount: moneyAmount,
					type: z.nativeEnum(PaymentType),
					employeeId: z.number().optional(),
					description: z.string().optional(),
					provider: z.string().optional(),
					maker: z.string().optional(),
					startingTime: z.date().optional(),
					endingTime: z.date().optional(),
				}),
				defaultValues: {
					date: new Date(),
					amount: "",
					type: PaymentType.Salary,
				},
				submitAction: handleCreatePayment,
			},
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
					filterFields={PAYMENT_FILTER_FIELDS}
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
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.pagamenti}
				/>
			}
		/>
	);
}
