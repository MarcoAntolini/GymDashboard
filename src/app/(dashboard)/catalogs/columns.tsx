"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import {
	PRODUCT_KIND_LABELS,
	type ProductKind,
} from "@/lib/domain/product-kind";
import type { CatalogRow } from "@/data-access/catalogs";
import { columnMeta } from "@/lib/domain/view-columns";
import { formatCurrencyEur } from "@/lib/format/locale";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

/** Create/edit payload: composite key only — no tipo; price as ≤2-decimal string. */
export const formSchema = z.object({
	year: z.number().int().positive("L'anno deve essere un intero positivo"),
	productCode: z.string().min(1, "Codice prodotto obbligatorio"),
	price: z
		.string()
		.min(1, "Prezzo obbligatorio")
		.refine(isValidCatalogPriceString, {
			message: "Prezzo positivo con al massimo 2 decimali",
		}),
});

export type CatalogProductOption = {
	code: string;
	membership: { duration: number } | null;
	entranceSet: { entranceNumber: number } | null;
};

export const columns = (
	handleDelete: (catalog: Pick<CatalogRow, "year" | "productCode">) => Promise<void>,
	handleEdit: (catalog: CatalogRow) => Promise<void>
): ColumnDef<CatalogRow>[] => [
	{
		accessorKey: "year",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Anno" />,
	},
	{
		accessorKey: "productKind",
		meta: columnMeta("derivata"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" />
		),
		cell: ({ row }) => {
			const kind = row.original.productKind;
			return (
				<div className="font-medium">
					{kind ? PRODUCT_KIND_LABELS[kind as ProductKind] : "—"}
				</div>
			);
		},
	},
	{
		accessorKey: "productCode",
		meta: columnMeta("nativa"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" />
		),
	},
	{
		accessorKey: "price",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Prezzo" />,
		cell: ({ row }) => {
			const price = row.getValue("price") as string;
			return <div className="font-medium">{formatCurrencyEur(price)}</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Listino"
				deleteConsequence="Il prezzo Listino non ha FK Restrict verso Acquisto: gli importi già venduti restano come snapshot sull'Acquisto."
				editFormContent={
					<>
						<p className="text-sm text-muted-foreground">
							Il prezzo Listino di un anno propone l&apos;importo alla vendita; sull&apos;Acquisto
							resta uno snapshot indipendente.
						</p>
						<FormField
							name="year"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Anno</FormLabel>
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
									<FormLabel>Codice prodotto</FormLabel>
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
									<FormLabel>Prezzo</FormLabel>
									<FormControl>
										<Input
											type="text"
											inputMode="decimal"
											placeholder="0.00"
											{...field}
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
						price: values.price,
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
