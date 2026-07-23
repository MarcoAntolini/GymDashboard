"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClocking, deleteClocking, editClocking, listClockings } from "@/data-access/clockings";
import { getEmployee } from "@/data-access/employees";
import { useEntityList } from "@/hooks/useEntityList";
import { Clocking } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Clockings() {
	const {
		data: clockings,
		total,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete,
		handleEdit,
	} = useEntityList<Clocking, "employeeId" | "entranceTime">(
		useMemo(
			() => ({
				list: listClockings,
				deleteAction: deleteClocking,
				editAction: editClocking,
			}),
			[]
		),
		["employeeId", "entranceTime"]
	);

	const handleCreateClocking = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const employee = await getEmployee(values.employeeId);
			if (!employee) {
				toast.error("Dipendente non trovato");
				return;
			}
			await createClocking(values);
			await refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Nuova Timbratura",
			icon: PlusCircle,
			dialogContent: (
				<>
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
										min={0}
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
								<FormLabel>Entrata</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="exitTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Uscita</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
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

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Timbratura">
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={clockings}
						entityLabel="Timbratura"
						filters={["employeeId"]}
						filterLabels={{
							employeeId: "ID Dipendente",
							entranceTime: "Entrata",
							exitTime: "Uscita",
						}}
						server={{
							query,
							onQueryChange: setQuery,
							total,
						}}
					/>
				}
			/>
		</EntityShell>
	);
}
