"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	createPayment,
	deletePayment,
	editPayment,
	getAllPayments,
	type PaymentRow,
} from "@/data-access/payments";
import { useEntityData } from "@/hooks/useEntityData";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import { cn } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns } from "./columns";

const moneyAmount = z
	.string()
	.min(1, "Amount is required")
	.refine(isValidCatalogPriceString, {
		message: "Amount must be a positive value with at most 2 decimal places",
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

export default function PaymentsPage() {
	const {
		data: payments,
		setData: setPayments,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<PaymentRow, "id">(
		useMemo(
			() => ({
				getAll: getAllPayments,
				deleteAction: deletePayment,
				editAction: async (entity: PaymentRow) => {
					await editPayment({
						id: entity.id,
						date: entity.date,
						amount: entity.amount,
						type: entity.type,
					});
					return entity;
				},
			}),
			[]
		),
		["id"]
	);

	const handleCreatePayment = useCallback(
		async (values: z.infer<typeof paymentSchema>) => {
			const newPayment = await createPayment(values);
			setPayments((prevPayments) => [...prevPayments, newPayment]);
		},
		[setPayments]
	);

	const actions: Action[] = [
		{
			title: "Add Payment",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
											>
												{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
								<FormLabel>Amount</FormLabel>
								<FormControl>
									<Input type="text" inputMode="decimal" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select payment type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={PaymentType.Salary}>Salary</SelectItem>
										<SelectItem value={PaymentType.Bill}>Bill</SelectItem>
										<SelectItem value={PaymentType.Equipment}>Equipment</SelectItem>
										<SelectItem value={PaymentType.Intervention}>Intervention</SelectItem>
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
													<FormLabel>Employee ID</FormLabel>
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
														<FormLabel>Description</FormLabel>
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
														<FormLabel>Provider</FormLabel>
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
														<FormLabel>Description</FormLabel>
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
														<FormLabel>Maker</FormLabel>
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
														<FormLabel>Starting Time</FormLabel>
														<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												name="endingTime"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Ending Time</FormLabel>
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

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={payments}
					filters={["type"]}
					facetedFilters={["type"]}
				/>
			}
		/>
	);
}
