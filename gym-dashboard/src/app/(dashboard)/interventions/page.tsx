"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createIntervention,
	deleteIntervention,
	editIntervention,
	getAllInterventions,
} from "@/data-access/interventions";
import { useEntityData } from "@/hooks/useEntityData";
import { Intervention } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function InterventionsPage() {
	const {
		data: interventions,
		setData: setInterventions,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Intervention, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllInterventions,
				deleteAction: deleteIntervention,
				editAction: editIntervention,
			}),
			[]
		),
		["paymentId"]
	);

	const handleCreateIntervention = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newIntervention = await createIntervention(values);
			setInterventions((prevInterventions) => [...prevInterventions, newIntervention]);
		},
		[setInterventions]
	);

	const actions: Action[] = [
		{
			title: "Add Intervention",
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
								<FormControl>
									<Input
										type="datetime-local"
										{...field}
										onChange={(e) => field.onChange(new Date(e.target.value))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="endingTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Ending Time</FormLabel>
								<FormControl>
									<Input
										type="datetime-local"
										{...field}
										onChange={(e) => field.onChange(new Date(e.target.value))}
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
					description: "",
					maker: "",
					startingTime: new Date(),
					endingTime: new Date(),
				},
				submitAction: handleCreateIntervention,
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
					data={interventions}
					filters={["paymentId", "maker"]}
				/>
			}
		/>
	);
}
