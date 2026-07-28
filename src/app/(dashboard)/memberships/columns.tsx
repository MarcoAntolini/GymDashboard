"use client";

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
import { Package, Timer } from "lucide-react";
import { z } from "zod";

export type MembershipRow = Prisma.MembershipGetPayload<{
	include: { product: true };
}>;

export const formSchema = z.object({
	productCode: z.string().min(1, "Il codice prodotto è obbligatorio"),
	duration: z.number().int().positive("La durata deve essere un intero positivo"),
});

export const columns = (
	handleDelete: (membership: Pick<MembershipRow, "productCode">) => Promise<void>,
	handleEdit: (membership: MembershipRow) => Promise<void>
): ColumnDef<MembershipRow>[] => [
	{
		accessorKey: "productCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "duration",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Durata (giorni)"
				icon={Timer}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <NumericCell>{row.original.duration}</NumericCell>,
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Abbonamento"
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
							name="duration"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Durata (giorni)</FormLabel>
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
					const updatedMembership = {
						...row.original,
						...values,
					};
					await handleEdit(updatedMembership);
				}}
				deleteAction={() =>
					handleDelete({ productCode: row.original.productCode })
				}
			/>
		),
	},
];
