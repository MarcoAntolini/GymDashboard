"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatDateTimeIt } from "@/lib/format";
import { Clocking } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	employeeId: z.number().int().positive(),
	entranceTime: z.date(),
	exitTime: z.date().optional()
});

export const columns = (
	handleDelete: (clocking: Pick<Clocking, "employeeId" | "entranceTime">) => Promise<void>,
	handleEdit: (clocking: Clocking) => Promise<void>
): ColumnDef<Clocking>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={UserRound} />
		),
		cell: ({ row }) => {
			return (
				<div className="tabular-nums">{row.original.employeeId.toString().padStart(4, "0")}</div>
			);
		}
	},
	{
		accessorKey: "entranceTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Entrata" icon={LogIn} />
		),
		cell: ({ row }) => {
			return (
				<div className="font-medium">{formatDateTimeIt(row.getValue("entranceTime"))}</div>
			);
		}
	},
	{
		accessorKey: "exitTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Uscita" icon={LogOut} />
		),
		cell: ({ row }) => {
			const date = row.getValue("exitTime");
			return date ? (
				<div className="font-medium">{formatDateTimeIt(date as Date)}</div>
			) : (
				<div className="text-muted-foreground">—</div>
			);
		}
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Timbratura"
				editFormContent={
					<>
						<FormField
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Dipendente</FormLabel>
									<FormControl>
										<Input type="number" {...field} disabled />
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
									<DateTimePicker
										field={field}
										onChange={(date) => field.onChange(date)}
										disabled={true}
									/>
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
				}
				editAction={async ({ values }) => {
					const updatedClocking = {
						...row.original,
						...values
					};
					await handleEdit(updatedClocking);
				}}
				deleteAction={() =>
					handleDelete({
						employeeId: row.original.employeeId,
						entranceTime: row.original.entranceTime
					})
				}
			/>
		)
	}
];
