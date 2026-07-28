"use client";

import {
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BillRow } from "@/data-access/bills";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateIt, formatEur } from "@/lib/format";
import { Bill } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Building2, Calendar, FileText, Hash } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	description: z.string().min(1),
	provider: z.string().min(1),
});

export const columns = (
	handleDelete: (bill: Pick<Bill, "paymentId">) => Promise<void>,
	handleEdit: (bill: Bill) => Promise<void>
): ColumnDef<BillRow>[] => [
	{
		accessorKey: "provider",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Fornitore" icon={Building2} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Descrizione" icon={FileText} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		id: "paymentDate",
		accessorFn: (row) => row.payment.date,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.payment.date)}</div>
		),
	},
	{
		id: "paymentAmount",
		accessorFn: (row) => Number(row.payment.amount),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo" icon={Banknote} align="right" />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="expense">{formatEur(row.original.payment.amount)}</MoneyTone>
			</NumericCell>
		),
	},
	{
		accessorKey: "paymentId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID Pagamento" icon={Hash} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.paymentId}</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Bolletta"
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrizione</FormLabel>
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
									<FormLabel>Fornitore</FormLabel>
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
					await handleEdit({
						paymentId: row.original.paymentId,
						description: values.description,
						provider: values.provider,
					});
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
