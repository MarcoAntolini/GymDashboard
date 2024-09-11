"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Clocking } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	employeeId: z.number().int().positive(),
	entranceTime: z.date(),
	exitTime: z.date().optional(),
});

export const columns = (
	handleDelete: (clocking: Pick<Clocking, "employeeId" | "entranceTime">) => Promise<void>,
	handleEdit: (clocking: Clocking) => Promise<void>
): ColumnDef<Clocking>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Employee ID"
			/>
		),
	},
	{
		accessorKey: "entranceTime",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Entrance Time"
			/>
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("entranceTime"));
			return <div className="font-medium">{date.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: "exitTime",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Exit Time"
			/>
		),
		cell: ({ row }) => {
			const date = row.getValue("exitTime");
			return date ? <div className="font-medium">{new Date(date as Date).toLocaleString()}</div> : <div>-</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				editFormContent={
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
											disabled
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
											disabled
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
				}
				editAction={async ({ values }) => {
					const updatedClocking = {
						...row.original,
						...values,
					};
					await handleEdit(updatedClocking);
				}}
				deleteAction={() =>
					handleDelete({ employeeId: row.original.employeeId, entranceTime: row.original.entranceTime })
				}
			/>
		),
	},
];
