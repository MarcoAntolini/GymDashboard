"use client";

import { TableCode, TableDateTime, TableId, TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { EntranceRow } from "@/data-access/entrances";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
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
			<TableSortableHeader column={column} title="ID" icon={ATTR_ICON.id} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableId value={row.original.id} filterKeys="id" />,
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native, { stacked: true }),
		cell: ({ row }) => (
			<TableDateTime value={row.original.date} />
		),
	},
	{
		id: "client",
		accessorFn: (row) =>
			`${row.sale.client.surname} ${row.sale.client.name} (#${row.sale.clientId})`,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={ENTITY_ICON.client} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<TablePerson
				person={{ ...row.original.sale.client, id: row.original.sale.clientId }}
				nameFilterKeys="client"
			/>
		),
	},
	{
		id: "product",
		accessorFn: (row) => row.sale.productCode,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={ENTITY_ICON.product} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<TableCode value={row.original.sale.productCode} filterKeys="product" />
		),
	},
	{
		accessorKey: "saleId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Vendita" icon={ENTITY_ICON.sale} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.saleId} filterKeys="saleId" />
		),
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
