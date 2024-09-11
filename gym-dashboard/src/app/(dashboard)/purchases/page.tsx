"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPurchase, deletePurchase, editPurchase, getAllPurchases } from "@/data-access/purchases";
import { useEntityData } from "@/hooks/useEntityData";
import { Purchase, PurchaseType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function PurchasesPage() {
	const {
		data: purchases,
		setData: setPurchases,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Purchase, "clientId" | "date">(
		useMemo(
			() => ({
				getAll: getAllPurchases,
				deleteAction: deletePurchase,
				editAction: editPurchase,
			}),
			[]
		),
		["clientId", "date"]
	);

	const handleCreatePurchase = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newPurchase = await createPurchase(values);
			setPurchases((prevPurchases) => [...prevPurchases, newPurchase]);
		},
		[setPurchases]
	);

	const actions: Action[] = [
		{
			title: "Add Purchase",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Client ID</FormLabel>
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
								<FormLabel>Date</FormLabel>
								<FormControl>
									<Input
										type="date"
										{...field}
										value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
										onChange={(e) => field.onChange(new Date(e.target.value))}
									/>
								</FormControl>
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
								<FormLabel>Type</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(PurchaseType).map((type) => (
											<SelectItem
												key={type}
												value={type}
											>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Code</FormLabel>
								<FormControl>
									<Input {...field} />
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
					amount: 0,
					type: PurchaseType.Membership,
					productCode: "",
				},
				submitAction: handleCreatePurchase,
			} as FormData<typeof formSchema>,
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
					data={purchases}
					filters={["clientId", "type", "productCode"]}
					facetedFilters={["type"]}
				/>
			}
		/>
	);
}
