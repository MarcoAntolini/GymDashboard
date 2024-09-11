"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSalary, deleteSalary, editSalary, getAllSalaries } from "@/data-access/salaries";
import { useEntityData } from "@/hooks/useEntityData";
import { Salary } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Salaries() {
	const {
		data: salaries,
		setData: setSalaries,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Salary, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllSalaries,
				deleteAction: deleteSalary,
				editAction: editSalary,
			}),
			[]
		),
		["paymentId"]
	);

	const handleCreateSalary = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newSalary = await createSalary(values);
			setSalaries((prevSalaries) => [...prevSalaries, newSalary]);
		},
		[setSalaries]
	);

	const actions: Action[] = [
		{
			title: "Add Salary",
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
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					paymentId: 0,
					employeeId: 0,
				},
				submitAction: handleCreateSalary,
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
					data={salaries}
					filters={["employeeId", "paymentId"]}
				/>
			}
		/>
	);
}
