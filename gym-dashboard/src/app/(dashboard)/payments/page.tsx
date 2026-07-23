"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { EntityShell } from "@/components/ui/entity-shell";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	createPayment,
	deletePayment,
	editPayment,
	listPayments,
	type PaymentDTO,
} from "@/data-access/payments";
import { useEntityList } from "@/hooks/useEntityList";
import { formatDateIt, paymentTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns } from "./columns";

const paymentSchema = z.object({
	date: z.date(),
	amount: z.number().min(0),
	type: z.enum(["Salary", "Bill", "Equipment", "Intervention"]),
	employeeId: z.number().optional(),
	description: z.string().optional(),
	provider: z.string().optional(),
	maker: z.string().optional(),
	startingTime: z.date().optional(),
	endingTime: z.date().optional(),
});

export default function PaymentsPage() {
	const {
		data: payments,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete,
		handleEdit,
	} = useEntityList<PaymentDTO, "id">(
		useMemo(
			() => ({
				list: listPayments,
				deleteAction: deletePayment,
				editAction: editPayment,
			}),
			[]
		),
		["id"]
	);

	const handleCreatePayment = useCallback(
		async (values: z.infer<typeof paymentSchema>) => {
			await createPayment(values as Parameters<typeof createPayment>[0]);
			await refetch();
		},
		[refetch]
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
											<SelectValue placeholder="Seleziona tipo" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{(Object.values(PaymentType) as PaymentType[]).map((type) => (
											<SelectItem key={type} value={type}>
												{paymentTypeLabel[type]}
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
								case "Salary":
									return (
										<FormField
											name="employeeId"
											render={({ field: idField }) => (
												<FormItem>
													<FormLabel>ID Dipendente</FormLabel>
													<FormControl>
														<Input
															type="number"
															{...idField}
															onChange={(e) =>
																idField.onChange(parseInt(e.target.value, 10))
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									);
								case "Bill":
								case "Equipment":
									return (
										<>
											<FormField
												name="description"
												render={({ field: descField }) => (
													<FormItem>
														<FormLabel>Descrizione</FormLabel>
														<FormControl>
															<Input {...descField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="provider"
												render={({ field: providerField }) => (
													<FormItem>
														<FormLabel>Fornitore</FormLabel>
														<FormControl>
															<Input {...providerField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									);
								case "Intervention":
									return (
										<>
											<FormField
												name="description"
												render={({ field: descField }) => (
													<FormItem>
														<FormLabel>Descrizione</FormLabel>
														<FormControl>
															<Input {...descField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="maker"
												render={({ field: makerField }) => (
													<FormItem>
														<FormLabel>Attuatore</FormLabel>
														<FormControl>
															<Input {...makerField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="startingTime"
												render={({ field: startField }) => (
													<FormItem>
														<FormLabel>Inizio</FormLabel>
														<DateTimePicker
															field={startField}
															onChange={(date) => startField.onChange(date)}
														/>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="endingTime"
												render={({ field: endField }) => (
													<FormItem>
														<FormLabel>Fine</FormLabel>
														<DateTimePicker
															field={endField}
															onChange={(date) => endField.onChange(date)}
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
				formSchema: paymentSchema,
				defaultValues: {
					date: new Date(),
					amount: 0,
					type: "Bill" as const,
				},
				submitAction: handleCreatePayment,
			},
		},
	];

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Pagamento">
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={payments}
						entityLabel="Pagamento"
						filters={["detail"]}
						facetedFilters={["typeLabel"]}
						filterLabels={{
							detail: "Dettaglio tipizzato",
							typeLabel: "Tipo",
							date: "Data",
							amount: "Importo",
							id: "ID",
						}}
						emptyGuidance="Usa Nuovo Pagamento per registrare Bolletta, Attrezzatura o Intervento."
						server={{
							query,
							onQueryChange: setQuery,
							total,
							facetOptions: facets,
						}}
					/>
				}
			/>
		</EntityShell>
	);
}
