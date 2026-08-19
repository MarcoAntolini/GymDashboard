"use client";

import {
	DotBadge,
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
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
import { formatEur } from "@/lib/format";
import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Calendar, Package, Tag } from "lucide-react";
import { z } from "zod";

export type CatalogRow = Prisma.CatalogGetPayload<{
	include: {
		product: {
			include: { membership: true; entranceSet: true };
		};
	};
}>;

export const formSchema = z.object({
	year: z.number().int().positive("L'anno deve essere un intero positivo"),
	productCode: z.string().min(1, "Il codice prodotto è obbligatorio"),
	price: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Il prezzo può avere al massimo 2 decimali")
		.refine((value) => Number(value) > 0, "Il prezzo deve essere un numero positivo"),
});

export const columns = (
	handleDelete: (catalog: Pick<CatalogRow, "year" | "productCode">) => Promise<void>,
	handleEdit: (catalog: CatalogRow) => Promise<void>
): ColumnDef<CatalogRow>[] => [
	{
		accessorKey: "year",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Anno" icon={Calendar} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <NumericCell>{row.original.year}</NumericCell>,
	},
	{
		id: "kind",
		accessorFn: (row) => {
			const kind = productKindFromProduct(row.product);
			return kind ? PRODUCT_KIND_LABEL[kind] : "—";
		},
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Tag} />
		),
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => {
			const kind = productKindFromProduct(row.original.product);
			if (!kind) return <div>—</div>;
			return <DotBadge label={PRODUCT_KIND_LABEL[kind]} tone={PRODUCT_KIND_TONE[kind]} />;
		},
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "price",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prezzo" icon={Banknote} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="income">{formatEur(row.original.price)}</MoneyTone>
			</NumericCell>
		),
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
				entityLabel="Voce di listino"
				editDescription="Anno e codice prodotto identificano la voce. Il prezzo è quello del Listino per quell'anno (usato come proposta sulla Vendita)."
				editFormContent={
					<>
						<FormField
							name="year"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Anno</FormLabel>
									<FormControl>
										<Input
											type="number"
											className="text-right tabular-nums"
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
											className="text-right tabular-nums"
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
