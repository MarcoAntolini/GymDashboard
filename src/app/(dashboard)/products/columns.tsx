"use client";

import { DotBadge } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import {
	PRODUCT_KIND_LABEL,
	productKindFromProduct,
} from "@/lib/domain/product-kind";
import { PRODUCT_KIND_TONE } from "@/lib/domain/visual";
import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Package, Tag } from "lucide-react";
import { z } from "zod";

export type ProductRow = Prisma.ProductGetPayload<{
	include: { membership: true; entranceSet: true };
}>;

export const formSchema = z.object({
	code: z.string().min(1, "Il codice prodotto è obbligatorio"),
});

export const columns = (
	handleDelete: (product: Pick<ProductRow, "code">) => Promise<void>,
	handleEdit: (product: ProductRow) => Promise<void>
): ColumnDef<ProductRow>[] => [
	{
		accessorKey: "code",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		id: "kind",
		accessorFn: (row) => {
			const kind = productKindFromProduct(row);
			return kind ? PRODUCT_KIND_LABEL[kind] : "—";
		},
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Tag} />
		),
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => {
			const kind = productKindFromProduct(row.original);
			if (!kind) return <div>—</div>;
			return <DotBadge label={PRODUCT_KIND_LABEL[kind]} tone={PRODUCT_KIND_TONE[kind]} />;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Prodotto"
				deleteDescription="Se il Prodotto ha Vendite o voci di Listino collegati, l'eliminazione viene rifiutata (vincolo Restrict)."
				editFormContent={
					<>
						<FormField
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Codice prodotto</FormLabel>
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
					const updatedProduct = {
						...row.original,
						...values,
					};
					await handleEdit(updatedProduct);
				}}
				deleteAction={() => handleDelete({ code: row.original.code })}
			/>
		),
	},
];
