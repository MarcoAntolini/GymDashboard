"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type ProductDTO } from "@/data-access/products";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	code: z.string().min(1, "Product code is required"),
});

function kindOf(product: ProductDTO): string {
	if (product.membership) return "Membership";
	if (product.entranceSet) return "EntranceSet";
	return "—";
}

export const columns = (
	handleDelete: (product: Pick<ProductDTO, "code">) => Promise<void>,
	handleEdit: (product: ProductDTO) => Promise<void>
): ColumnDef<ProductDTO>[] => [
	{
		accessorKey: "code",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Product Code" />
		),
	},
	{
		id: "kind",
		accessorFn: (row) => kindOf(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Type" />
		),
		enableSorting: false,
		filterFn: (row, id, value) => {
			return (value as string[]).includes(row.getValue(id));
		},
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
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Code</FormLabel>
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
