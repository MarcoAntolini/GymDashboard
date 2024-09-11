"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createEquipment, deleteEquipment, editEquipment, getAllEquipment } from "@/data-access/equipment";
import { useEntityData } from "@/hooks/useEntityData";
import { Equipment } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function EquipmentPage() {
	const {
		data: equipment,
		setData: setEquipment,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Equipment, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllEquipment,
				deleteAction: deleteEquipment,
				editAction: editEquipment,
			}),
			[]
		),
		["paymentId"]
	);

	const handleCreateEquipment = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newEquipment = await createEquipment(values);
			setEquipment((prevEquipment) => [...prevEquipment, newEquipment]);
		},
		[setEquipment]
	);

	const actions: Action[] = [
		{
			title: "Add Equipment",
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
				submitAction: handleCreateEquipment,
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
					data={equipment}
					filters={["paymentId", "provider"]}
				/>
			}
		/>
	);
}
