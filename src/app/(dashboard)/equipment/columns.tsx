"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Equipment } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	description: z.string().min(1),
	provider: z.string().min(1),
});

export const columns = (
	handleDelete: (equipment: Pick<Equipment, "paymentId">) => Promise<void>,
	handleEdit: (equipment: Equipment) => Promise<void>
): ColumnDef<Equipment>[] => [
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
		accessorKey: "provider",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Provider"
			/>
		),
	},
	// {
	// 	accessorKey: "payment.amount",
	// 	header: ({ column }) => (
	// 		<TableSortableHeader
	// 			column={column}
	// 			title="Amount"
	// 		/>
	// 	),
	// 	cell: ({ row }) => {
	// 		const amount = parseFloat(row.original.payment.amount);
	// 		const formatted = new Intl.NumberFormat("en-US", {
	// 			style: "currency",
	// 			currency: "USD",
	// 		}).format(amount);
	// 		return <div className="font-medium">{formatted}</div>;
	// 	},
	// },
	// {
	// 	accessorKey: "payment.date",
	// 	header: ({ column }) => (
	// 		<TableSortableHeader
	// 			column={column}
	// 			title="Payment Date"
	// 		/>
	// 	),
	// 	cell: ({ row }) => {
	// 		const date = new Date(row.original.payment.date);
	// 		return <div className="font-medium">{date.toLocaleDateString()}</div>;
	// 	},
	// },
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
				}
				editAction={async ({ values }) => {
					const updatedEquipment = {
						...row.original,
						...values,
					};
					await handleEdit(updatedEquipment);
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
