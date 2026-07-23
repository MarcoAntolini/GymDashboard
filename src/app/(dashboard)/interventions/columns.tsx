"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Intervention } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	description: z.string().min(1),
	maker: z.string().min(1),
	startingTime: z.date(),
	endingTime: z.date(),
});

export const columns = (
	handleDelete: (intervention: Pick<Intervention, "paymentId">) => Promise<void>,
	handleEdit: (intervention: Intervention) => Promise<void>
): ColumnDef<Intervention>[] => [
	{
		accessorKey: "paymentId",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Payment ID"
			/>
		),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Description"
			/>
		),
	},
	{
		accessorKey: "maker",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Maker"
			/>
		),
	},
	{
		accessorKey: "startingTime",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Starting Time"
			/>
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("startingTime"));
			return <div className="font-medium">{date.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: "endingTime",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Ending Time"
			/>
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("endingTime"));
			return <div className="font-medium">{date.toLocaleString()}</div>;
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
							name="paymentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment ID</FormLabel>
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
				}
				editAction={async ({ values }) => {
					const updatedIntervention = {
						...row.original,
						...values,
					};
					await handleEdit(updatedIntervention);
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
