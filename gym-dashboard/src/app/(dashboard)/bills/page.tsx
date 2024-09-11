"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createBill, deleteBill, editBill, getAllBills } from "@/data-access/bills";
import { useEntityData } from "@/hooks/useEntityData";
import { Bill } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function BillsPage() {
	const {
		data: bills,
		setData: setBills,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Bill, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllBills,
				deleteAction: deleteBill,
				editAction: editBill,
			}),
			[]
		),
		["paymentId"]
	);

	const handleCreateBill = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newBill = await createBill(values);
			setBills((prevBills) => [...prevBills, newBill]);
		},
		[setBills]
	);

	const actions: Action[] = [
		{
			title: "Add Bill",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="paymentId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Payment ID</FormLabel>
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
			),
			formData: {
				formSchema,
				defaultValues: {
					paymentId: 0,
					description: "",
					provider: "",
				},
				submitAction: handleCreateBill,
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
					data={bills}
					filters={["paymentId", "provider"]}
				/>
			}
		/>
	);
}
