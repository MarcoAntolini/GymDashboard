"use client";

import { DotBadge } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EntranceRow } from "@/data-access/entrances";
import {
	deriveProductKind,
} from "@/lib/domain/product-kind";
import { columnMeta } from "@/lib/domain/view-columns";
import { productKindChip } from "@/lib/format/domain-visuals";
import { formatDateTimeIt } from "@/lib/format/locale";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Hash, Package, ShoppingBag, Tag, UserRound } from "lucide-react";
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		),
	},
	{
		id: "client",
		meta: columnMeta("join"),
		accessorFn: (row) =>
			`${row.purchase.client.surname} ${row.purchase.client.name}`,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={UserRound} />
		),
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={CalendarDays} />
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{formatDateTimeIt(date)}</div>;
		},
	},
	{
		id: "purchase",
		meta: columnMeta("nativa"),
		accessorFn: (row) => row.purchaseId,
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Acquisto giustificante"
				icon={ShoppingBag}
			/>
		),
		cell: ({ row }) => {
			const purchase = row.original.purchase;
			const kind = deriveProductKind(purchase.prodotto);
			const chip = productKindChip(kind);
			return (
				<div className="flex flex-wrap items-center gap-2 font-medium">
					<span>#{row.original.purchaseId}</span>
					<span className="text-xs font-normal text-muted-foreground">
						{purchase.productCode}
					</span>
					{chip ? <DotBadge label={chip.label} tone={chip.tone} /> : null}
				</div>
			);
		},
	},
	{
		id: "product",
		meta: columnMeta("join"),
		accessorFn: (row) => row.purchase.productCode,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={Package} />
		),
		cell: ({ row }) => (
			<div className="font-medium">{row.original.purchase.productCode}</div>
		),
	},
	{
		id: "productKind",
		meta: columnMeta("derivata"),
		accessorFn: (row) => deriveProductKind(row.purchase.prodotto) ?? "",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Tag} />
		),
		cell: ({ row }) => {
			const kind = deriveProductKind(row.original.purchase.prodotto);
			const chip = productKindChip(kind);
			if (!chip) return <span className="text-muted-foreground">—</span>;
			return <DotBadge label={chip.label} tone={chip.tone} />;
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
					entityLabel="Ingresso"
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
										<FormLabel>Data</FormLabel>
										<DateTimePicker
											field={field}
											onChange={(date) => field.onChange(date)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex flex-col gap-2 rounded-md border border-border p-3">
								<p className="text-sm font-medium">Acquisto giustificante</p>
								<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									<span>
										#{row.original.purchaseId} · {row.original.purchase.productCode}
									</span>
									{(() => {
										const chip = productKindChip(
											deriveProductKind(row.original.purchase.prodotto)
										);
										return chip ? (
											<DotBadge label={chip.label} tone={chip.tone} />
										) : null;
									})()}
								</div>
								<p className="text-xs text-muted-foreground">
									Salvando, il sistema ricalcola l&apos;Acquisto (Abbonamento valido più
									recente, altrimenti Pacchetto con residuo FIFO). Non si sceglie a mano.
								</p>
							</div>
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
