"use client";

import {
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import { TableDate, TableId } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EquipmentRow } from "@/data-access/equipment";
import { LONG_TEXT_COLUMN_SIZE } from "@/components/ui/data-table/table-column-layout";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import { formatEur } from "@/lib/format";
import { Equipment } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	description: z.string().min(1),
	provider: z.string().min(1),
});

export const columns = (
	handleDelete: (equipment: Pick<Equipment, "paymentId">) => Promise<void>,
	handleEdit: (equipment: Equipment) => Promise<void>
): ColumnDef<EquipmentRow>[] => [
	{
		accessorKey: "provider",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Fornitore" icon={ATTR_ICON.provider} />
		),
		meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Descrizione" icon={ATTR_ICON.description} />
		),
		meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
		size: LONG_TEXT_COLUMN_SIZE,
	},
	{
		id: "paymentDate",
		accessorFn: (row) => row.payment.date,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data pagamento" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => <TableDate value={row.original.payment.date} />,
	},
	{
		id: "paymentAmount",
		accessorFn: (row) => Number(row.payment.amount),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo" icon={ATTR_ICON.amount} align="right" />
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
			<TableSortableHeader column={column} title="ID Pagamento" icon={ENTITY_ICON.payment} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.paymentId} filterKeys="paymentId" />
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Attrezzatura"
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
