"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Salary } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Hash, UserRound } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	employeeId: z.number().int().positive()
});

export const columns = (
	handleDelete: (salary: Pick<Salary, "paymentId">) => Promise<void>,
	handleEdit: (salary: Salary) => Promise<void>
): ColumnDef<Salary>[] => [
	{
		accessorKey: "paymentId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Pagamento" icon={Hash} />
		)
	},
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
	// {
	// 	accessorKey: "employee.name",
	// 	header: ({ column }) => (
	// 		<TableSortableHeader
	// 			column={column}
	// 			title="Employee Name"
	// 		/>
	// 	),
	// 	cell: ({ row }) => {
	// 		return <div className="font-medium">{`${row.original.employee.name} ${row.original.employee.surname}`}</div>;
	// 	},
	// },
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Stipendio"
				deleteDescription="Elimina lo Stipendio collegato al Pagamento. Preferisci gestire creazione e tipo da Pagamenti. L'operazione non può essere annullata."
				editFormContent={
					<>
						<FormField
							name="paymentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Pagamento</FormLabel>
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
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Dipendente</FormLabel>
									<FormControl>
										<Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedSalary = {
						...row.original,
						...values
					};
					await handleEdit(updatedSalary);
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		)
	}
];
