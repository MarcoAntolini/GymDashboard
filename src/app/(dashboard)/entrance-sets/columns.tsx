"use client";

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
import { z } from "zod";

export type EntranceSetRow = Prisma.EntranceSetGetPayload<{
	include: { product: true };
}>;

export const formSchema = z.object({
	productCode: z.string().min(1, "Product code is required"),
	entranceNumber: z
		.number()
		.int()
		.positive("Number of entrances must be a positive integer"),
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
			<TableSortableHeader column={column} title="Codice prodotto" />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="N ingressi" />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				editFormContent={
					<>
						<FormField
							name="productCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Code</FormLabel>
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
									<FormLabel>Number of Entrances</FormLabel>
									<FormControl>
										<Input
											type="number"
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
