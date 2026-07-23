"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EntranceRow } from "@/data-access/entrances";
import {
	PRODUCT_KIND_LABELS,
	deriveProductKind,
} from "@/lib/domain/product-kind";
import { columnMeta } from "@/lib/domain/view-columns";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export type ClientOption = {
	id: number;
	name: string;
	surname: string;
};

/** Create: pick Cliente (+ date). purchaseId is chosen server-side. */
export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
});

/** Edit: date (+ optional client). No purchaseId override. */
export const editFormSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
});

export type EditEntranceValues = z.infer<typeof editFormSchema> & { id: number };

export const columns = (
	handleDelete: (entrance: Pick<EntranceRow, "id">) => Promise<void>,
	handleEdit: (values: EditEntranceValues) => Promise<void>,
	clients: ClientOption[]
): ColumnDef<EntranceRow>[] => [
	{
		accessorKey: "id",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
	},
	{
		id: "client",
		meta: columnMeta("join"),
		accessorFn: (row) =>
			`${row.purchase.client.surname} ${row.purchase.client.name}`,
		header: ({ column }) => <TableSortableHeader column={column} title="Cliente" />,
		cell: ({ row }) => {
			const { name, surname, id } = row.original.purchase.client;
			return (
				<div className="font-medium">
					{surname} {name}{" "}
					<span className="text-muted-foreground text-xs">#{id}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "date",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Date" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{date.toLocaleString()}</div>;
		},
	},
	{
		id: "purchase",
		meta: columnMeta("nativa"),
		accessorFn: (row) => row.purchaseId,
		header: ({ column }) => <TableSortableHeader column={column} title="Acquisto" />,
		cell: ({ row }) => (
			<div className="font-medium">#{row.original.purchaseId}</div>
		),
	},
	{
		id: "product",
		meta: columnMeta("join"),
		accessorFn: (row) => row.purchase.productCode,
		header: ({ column }) => <TableSortableHeader column={column} title="Prodotto" />,
		cell: ({ row }) => (
			<div className="font-medium">{row.original.purchase.productCode}</div>
		),
	},
	{
		id: "productKind",
		meta: columnMeta("derivata"),
		accessorFn: (row) => deriveProductKind(row.purchase.prodotto) ?? "",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Type (derived · live)" />
		),
		cell: ({ row }) => {
			const kind = deriveProductKind(row.original.purchase.prodotto);
			return (
				<div className="font-medium text-muted-foreground">
					{kind ? PRODUCT_KIND_LABELS[kind] : "—"}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const formDefaults = {
				...row.original,
				clientId: row.original.purchase.clientId,
			};
			return (
				<ItemActions
					row={{ ...row, original: formDefaults }}
					formSchema={editFormSchema}
					editFormContent={
						<>
							<FormField
								name="clientId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cliente</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(parseInt(value, 10))}
											value={field.value ? String(field.value) : undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona cliente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{clients.map((client) => (
													<SelectItem key={client.id} value={String(client.id)}>
														{client.surname} {client.name} (#{client.id})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date</FormLabel>
										<DateTimePicker
											field={field}
											onChange={(date) => field.onChange(date)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					}
					editAction={async ({ values }) => {
						await handleEdit({
							id: row.original.id,
							clientId: values.clientId,
							date: new Date(values.date),
						});
					}}
					deleteAction={() => handleDelete({ id: row.original.id })}
				/>
			);
		},
	},
];
