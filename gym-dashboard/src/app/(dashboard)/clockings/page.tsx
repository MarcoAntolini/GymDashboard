"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClocking, deleteClocking, editClocking, getAllClockings } from "@/data-access/clockings";
import { useEntityData } from "@/hooks/useEntityData";
import { Clocking } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Clockings() {
	const {
		data: clockings,
		setData: setClockings,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Clocking, "employeeId" | "entranceTime">(
		useMemo(
			() => ({
				getAll: getAllClockings,
				deleteAction: deleteClocking,
				editAction: editClocking,
			}),
			[]
		),
		["employeeId", "entranceTime"]
	);

	const handleCreateClocking = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newClocking = await createClocking(values);
			setClockings((prevClockings) => [...prevClockings, newClocking]);
		},
		[setClockings]
	);

	const actions: Action[] = [
		{
			title: "Add Clocking",
			icon: PlusCircle,
			dialogContent: (
				<>
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
					<FormField
						name="entranceTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Entrance Time</FormLabel>
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
						name="exitTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Exit Time</FormLabel>
								<FormControl>
									<Input
										type="datetime-local"
										{...field}
										onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
					employeeId: 0,
					entranceTime: new Date(),
					exitTime: undefined,
				},
				submitAction: handleCreateClocking,
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
					data={clockings}
					filters={["employeeId"]}
				/>
			}
		/>
	);
}
