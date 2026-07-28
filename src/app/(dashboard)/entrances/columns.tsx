"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { EntranceRow } from "@/data-access/entrances";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateTimeIt } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

/** Create: solo Cliente (+ data opzionale in form; default now lato server). Niente purchaseId. */
export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
});

/** Edit: solo data (Acquisto/Cliente restano quelli della giustificazione originale). */
export const editFormSchema = z.object({
	date: z.date(),
});

export type ClientOption = {
	id: number;
	name: string;
	surname: string;
};

export const columns = (
	handleDelete: (entrance: Pick<EntranceRow, "id">) => Promise<void>,
	handleEdit: (entrance: EntranceRow) => Promise<void>
): ColumnDef<EntranceRow>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "date",
		header: ({ column }) => <TableSortableHeader column={column} title="Data" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateTimeIt(row.original.date)}</div>
		),
	},
	{
		id: "client",
		accessorFn: (row) =>
			`${row.purchase.client.surname} ${row.purchase.client.name} (#${row.purchase.clientId})`,
		header: ({ column }) => <TableSortableHeader column={column} title="Cliente" />,
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => {
			const client = row.original.purchase.client;
			return (
				<div className="font-medium">
					{client.surname} {client.name}{" "}
					<span className="text-muted-foreground">#{client.id}</span>
				</div>
			);
		},
	},
	{
		id: "product",
		accessorFn: (row) => row.purchase.productCode,
		header: ({ column }) => <TableSortableHeader column={column} title="Prodotto" />,
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">{row.original.purchase.productCode}</div>
		),
	},
	{
		accessorKey: "purchaseId",
		header: ({ column }) => <TableSortableHeader column={column} title="Acquisto" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={editFormSchema}
				editFormContent={
					<>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date</FormLabel>
									<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedEntrance = {
						...row.original,
						date: new Date(values.date),
					};
					await handleEdit(updatedEntrance);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
