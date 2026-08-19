"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HighlightText } from "@/components/ui/highlight-text";
import type { EntranceRow } from "@/data-access/entrances";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateTimeIt } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, Hash, Package, ShoppingBag, User } from "lucide-react";
import { z } from "zod";

/** Create: solo Cliente (+ data opzionale in form; default now lato server). Niente saleId. */
export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
});

/** Edit: solo data (Vendita/Cliente restano quelli della giustificazione originale). */
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateTimeIt(row.original.date)}</div>
		),
	},
	{
		id: "client",
		accessorFn: (row) =>
			`${row.sale.client.surname} ${row.sale.client.name} (#${row.sale.clientId})`,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={User} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => {
			const client = row.original.sale.client;
			return (
				<div className="font-medium">
					<HighlightText
						text={`${client.surname} ${client.name}`}
						filterKeys="client"
					/>{" "}
					<span className="text-muted-foreground">#{client.id}</span>
				</div>
			);
		},
	},
	{
		id: "product",
		accessorFn: (row) => row.sale.productCode,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">
				<HighlightText
					text={row.original.sale.productCode}
					filterKeys="product"
				/>
			</div>
		),
	},
	{
		accessorKey: "saleId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Vendita" icon={ShoppingBag} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={editFormSchema}
				entityLabel="Ingresso"
				editDescription="Puoi correggere solo la data. Cliente e Vendita restano quelli scelti alla registrazione (giustificazione automatica)."
				editFormContent={
					<>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data</FormLabel>
									<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormItem>
							<FormLabel>Vendita</FormLabel>
							<p className="text-sm text-muted-foreground">
								#{row.original.saleId} — {row.original.sale.productCode} (bloccato)
							</p>
						</FormItem>
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
