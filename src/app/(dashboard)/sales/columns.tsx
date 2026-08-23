"use client";

import {
	DotBadge,
	MoneyTone,
	NumericCell,
	RemainingEntrancesBadge,
} from "@/components/ui/domain-badge";
import { TableCode, TableDate, TableId, TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SaleListRow } from "@/data-access/sales";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";
import { PRODUCT_KIND_TONE } from "@/lib/domain/visual";
import { formatEur } from "@/lib/format";
import { Prisma } from "@prisma/client";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { useMemo, useState } from "react";
import { z } from "zod";

export type ProductWithSpec = Prisma.ProductGetPayload<{
	include: { membership: true; entranceSet: true };
}>;

export type SaleRow = SaleListRow;

export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
	amount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "L'importo può avere al massimo 2 decimali")
		.refine((value) => Number(value) > 0, "L'importo deve essere un numero positivo"),
	productCode: z.string().min(1),
});

export const columns = (
	handleDelete: (sale: Pick<SaleRow, "id">) => Promise<void>,
	handleEdit: (sale: SaleRow) => Promise<void>,
	products: ProductWithSpec[]
): ColumnDef<SaleRow>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={ATTR_ICON.id} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.id} filterKeys="id" />
		),
	},
	{
		id: "client",
		accessorFn: (row) =>
			`${row.client.surname} ${row.client.name} (#${row.clientId})`,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={ENTITY_ICON.client} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<TablePerson
				person={{ ...row.original.client, id: row.original.clientId }}
				nameFilterKeys="client"
				idFilterKeys="clientId"
			/>
		),
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.date} />,
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Importo"
				icon={ATTR_ICON.amount}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="income">{formatEur(row.original.amount)}</MoneyTone>
			</NumericCell>
		),
	},
	{
		id: "type",
		accessorFn: (row) => productKindFromSnapshot(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={ATTR_ICON.type} />
		),
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => {
			const kind = productKindFromSnapshot(row.original);
			return <DotBadge label={PRODUCT_KIND_LABEL[kind]} tone={PRODUCT_KIND_TONE[kind]} />;
		},
		filterFn: (row, _id, value: string[]) => {
			const kind = productKindFromSnapshot(row.original);
			return value.includes(kind);
		},
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={ENTITY_ICON.product} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableCode value={row.original.productCode} filterKeys="productCode" />
		),
	},
	{
		accessorKey: "duration",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Durata"
				icon={ATTR_ICON.duration}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => {
			const duration = row.getValue("duration") as number | null;
			return (
				<NumericCell muted>
					{duration != null ? `${duration} gg` : "—"}
				</NumericCell>
			);
		},
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="N ingressi"
				icon={ENTITY_ICON.entrance}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => {
			const n = row.getValue("entranceNumber") as number | null;
			return <NumericCell muted>{n != null ? n : "—"}</NumericCell>;
		},
	},
	{
		id: "remainingEntrances",
		accessorKey: "remainingEntrances",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Ingressi rimanenti"
				icon={ENTITY_ICON.entrance}
				align="right"
			/>
		),
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => (
			<NumericCell>
				<RemainingEntrancesBadge
					remaining={row.original.remainingEntrances}
					snapshotN={row.original.entranceNumber}
				/>
			</NumericCell>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<SaleRowActions
				row={row}
				products={products}
				handleDelete={handleDelete}
				handleEdit={handleEdit}
			/>
		),
	},
];

function SaleRowActions({
	row,
	products,
	handleDelete,
	handleEdit,
}: {
	row: Row<SaleRow>;
	products: ProductWithSpec[];
	handleDelete: (sale: Pick<SaleRow, "id">) => Promise<void>;
	handleEdit: (sale: SaleRow) => Promise<void>;
}) {
	const sale = row.original;
	const [selectedType, setSelectedType] = useState<ProductKind>(() =>
		productKindFromSnapshot(sale)
	);
	const filteredProducts = useMemo(
		() =>
			products.filter(
				(product) =>
					(product.active || product.code === sale.productCode) &&
					(selectedType === ProductKind.Membership
						? product.membership
						: product.entranceSet)
			),
		[products, sale.productCode, selectedType]
	);

	return (
		<ItemActions
			row={{
				...row,
				original: {
					...sale,
					amount: String(sale.amount),
				},
			}}
			formSchema={formSchema}
			entityLabel="Vendita"
			deleteDescription="Se la Vendita ha Ingressi collegati, l'eliminazione viene rifiutata (vincolo Restrict)."
			editFormContent={
				<>
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Cliente</FormLabel>
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
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Data</FormLabel>
								<FormDateField
									value={field.value}
									onChange={field.onChange}
									disabledDates={(date) => date < new Date("1900-01-01")}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="space-y-2">
						<Label>Tipo</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(PRODUCT_KIND_LABEL) as ProductKind[]).map((kind) => (
									<SelectItem key={kind} value={kind}>
										{PRODUCT_KIND_LABEL[kind]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<FormField
						name="productCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Prodotto</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={filteredProducts.length === 0}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={
													filteredProducts.length === 0
														? `Nessun ${PRODUCT_KIND_LABEL[selectedType].toLowerCase()} disponibile`
														: "Seleziona un prodotto"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}
												{product.description
													? ` — ${product.description}`
													: ""}
												{selectedType === ProductKind.Membership
													? ` (${product.membership?.duration} gg)`
													: ` (${product.entranceSet?.entranceNumber} ingressi)`}
												{product.active ? "" : " · archiviato"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="amount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Importo</FormLabel>
								<FormControl>
									<Input
										type="text"
										inputMode="decimal"
										placeholder="0.00"
										className="text-right tabular-nums"
										{...field}
										value={
											typeof field.value === "string"
												? field.value
												: String(field.value ?? "")
										}
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
					...sale,
					clientId: values.clientId,
					date: values.date,
					amount: values.amount as unknown as SaleRow["amount"],
					productCode: values.productCode,
				});
			}}
			deleteAction={() => handleDelete({ id: sale.id })}
		/>
	);
}
