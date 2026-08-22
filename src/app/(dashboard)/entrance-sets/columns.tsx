"use client";

import { TableCode } from "@/components/ui/data-table/table-cells";
import { NumericCell } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Hash, Package } from "lucide-react";
import { z } from "zod";

export type EntranceSetRow = Prisma.EntranceSetGetPayload<{
	include: { product: true };
}>;

export const formSchema = z.object({
	productCode: z.string().min(1, "Il codice prodotto è obbligatorio"),
	entranceNumber: z
		.number()
		.int()
		.positive("Il numero di ingressi deve essere un intero positivo"),
});

export const columns = (
	handleDelete: (
		entranceSet: Pick<EntranceSetRow, "productCode">
	) => Promise<void>,
	handleEdit: (entranceSet: EntranceSetRow) => Promise<void>
): ColumnDef<EntranceSetRow>[] => [
	{
		accessorKey: "productCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableCode value={row.original.productCode} filterKeys="productCode" />
		),
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="N ingressi"
				icon={Hash}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <NumericCell>{row.original.entranceNumber}</NumericCell>,
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Pacchetto ingressi"
				editFormContent={
					<>
						<FormField
							name="productCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Codice prodotto</FormLabel>
									<FormControl>
										<Input {...field} disabled />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="entranceNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>N ingressi</FormLabel>
									<FormControl>
										<Input
											type="number"
											className="text-right tabular-nums"
											{...field}
											onChange={(e) =>
												field.onChange(parseInt(e.target.value))
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedEntranceSet = {
						...row.original,
						...values,
					};
					await handleEdit(updatedEntranceSet);
				}}
				deleteAction={() =>
					handleDelete({ productCode: row.original.productCode })
				}
			/>
		),
	},
];
