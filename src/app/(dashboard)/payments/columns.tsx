"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { formatDateIt, formatEur } from "@/lib/format";
import { Payment, PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	date: z.date(),
	amount: z.number().positive("L'importo deve essere un numero positivo"),
	type: z.nativeEnum(PaymentType),
});

export const columns = (
	handleDelete: (payment: Pick<Payment, "id">) => Promise<void>,
	handleEdit: (
		payment: Omit<Payment, "amount"> & { amount: Payment["amount"] | number }
	) => Promise<void>
): ColumnDef<Payment>[] => [
	{
		accessorKey: "date",
		header: ({ column }) => <TableSortableHeader column={column} title="Data" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.date)}</div>
		),
	},
	{
		accessorKey: "amount",
		header: ({ column }) => <TableSortableHeader column={column} title="Importo" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatEur(row.original.amount)}</div>
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div>{PAYMENT_TYPE_LABEL[row.original.type]}</div>
		),
	},
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.id}</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={{
					...row,
					original: {
						...row.original,
						amount: Number(row.original.amount),
					},
				}}
				formSchema={formSchema}
				editFormContent={
					<>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data</FormLabel>
									<FormControl>
										<Input
											type="date"
											{...field}
											value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
											onChange={(e) => field.onChange(new Date(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Importo</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											{...field}
											onChange={(e) => field.onChange(parseFloat(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleziona un tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(PaymentType).map((type) => (
												<SelectItem key={type} value={type}>
													{PAYMENT_TYPE_LABEL[type]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						id: row.original.id,
						date: values.date,
						amount: values.amount,
						type: values.type,
					});
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
