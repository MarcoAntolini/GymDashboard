"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	PRODUCT_KIND_LABEL,
	productKindFromProduct,
} from "@/lib/domain/product-kind";
import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export type CatalogRow = Prisma.CatalogGetPayload<{
	include: {
		product: {
			include: { membership: true; entranceSet: true };
		};
	};
}>;

export const formSchema = z.object({
	year: z.number().int().positive("Year must be a positive integer"),
	productCode: z.string().min(1, "Product code is required"),
	price: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Price must have at most 2 decimal places")
		.refine((value) => Number(value) > 0, "Price must be a positive number"),
});

function formatPrice(price: CatalogRow["price"]) {
	const amount = Number(price);
	return new Intl.NumberFormat("it-IT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export const columns = (
	handleDelete: (catalog: Pick<CatalogRow, "year" | "productCode">) => Promise<void>,
	handleEdit: (catalog: CatalogRow) => Promise<void>
): ColumnDef<CatalogRow>[] => [
	{
		accessorKey: "year",
		header: ({ column }) => <TableSortableHeader column={column} title="Year" />,
	},
	{
		id: "kind",
		accessorFn: (row) => {
			const kind = productKindFromProduct(row.product);
			return kind ? PRODUCT_KIND_LABEL[kind] : "—";
		},
		header: ({ column }) => <TableSortableHeader column={column} title="Type" />,
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => <TableSortableHeader column={column} title="Product Code" />,
	},
	{
		accessorKey: "price",
		header: ({ column }) => <TableSortableHeader column={column} title="Price" />,
		cell: ({ row }) => <div className="font-medium">{formatPrice(row.original.price)}</div>,
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={{
					...row,
					original: {
						...row.original,
						price: String(row.original.price),
					},
				}}
				formSchema={formSchema}
				editFormContent={
					<>
						<FormField
							name="year"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Year</FormLabel>
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
							name="price"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Price</FormLabel>
									<FormControl>
										<Input
											type="text"
											inputMode="decimal"
											{...field}
											value={typeof field.value === "string" ? field.value : String(field.value ?? "")}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						...row.original,
						year: values.year,
						productCode: values.productCode,
						price: values.price as unknown as CatalogRow["price"],
					});
				}}
				deleteAction={() =>
					handleDelete({
						year: row.original.year,
						productCode: row.original.productCode,
					})
				}
			/>
		),
	},
];
