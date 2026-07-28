"use client";

import {
	DotBadge,
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HighlightText } from "@/components/ui/highlight-text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";
import { PRODUCT_KIND_TONE } from "@/lib/domain/visual";
import { formatDateIt, formatEur } from "@/lib/format";
import { Prisma } from "@prisma/client";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Banknote, Calendar, Hash, Package, Tag, Timer, User } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

export type ProductWithSpec = Prisma.ProductGetPayload<{
	include: { membership: true; entranceSet: true };
}>;

export type PurchaseRow = Prisma.PurchaseGetPayload<{
	include: {
		client: true;
		prodotto: { include: { membership: true; entranceSet: true } };
	};
}>;

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
	handleDelete: (purchase: Pick<PurchaseRow, "id">) => Promise<void>,
	handleEdit: (purchase: PurchaseRow) => Promise<void>,
	products: ProductWithSpec[]
): ColumnDef<PurchaseRow>[] => [
	{
		id: "client",
		accessorFn: (row) =>
			`${row.client.surname} ${row.client.name} (#${row.clientId})`,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={User} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => {
			const client = row.original.client;
			return (
				<div className="font-medium">
					<HighlightText
						text={`${client.surname} ${client.name}`}
						filterKeys="client"
					/>{" "}
					<span className="text-muted-foreground">
						#
						<HighlightText text={String(client.id)} filterKeys="clientId" />
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.date)}</div>
		),
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Importo (snapshot)"
				icon={Banknote}
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
			<TableSortableHeader column={column} title="Tipo" icon={Tag} />
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
			<TableSortableHeader column={column} title="Codice prodotto" icon={Package} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "duration",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Durata (snapshot)"
				icon={Timer}
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
				title="N ingressi (snapshot)"
				icon={Hash}
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
		id: "actions",
		cell: ({ row }) => (
			<PurchaseRowActions
				row={row}
				products={products}
				handleDelete={handleDelete}
				handleEdit={handleEdit}
			/>
		),
	},
];

function PurchaseRowActions({
	row,
	products,
	handleDelete,
	handleEdit,
}: {
	row: Row<PurchaseRow>;
	products: ProductWithSpec[];
	handleDelete: (purchase: Pick<PurchaseRow, "id">) => Promise<void>;
	handleEdit: (purchase: PurchaseRow) => Promise<void>;
}) {
	const purchase = row.original;
	const [selectedType, setSelectedType] = useState<ProductKind>(() =>
		productKindFromSnapshot(purchase)
	);
	const filteredProducts = useMemo(
		() =>
			products.filter((product) =>
				selectedType === ProductKind.Membership ? product.membership : product.entranceSet
			),
		[products, selectedType]
	);

	return (
		<ItemActions
			row={{
				...row,
				original: {
					...purchase,
					amount: String(purchase.amount),
				},
			}}
			formSchema={formSchema}
			entityLabel="Acquisto"
			deleteDescription="Se l'Acquisto ha Ingressi collegati, l'eliminazione viene rifiutata (vincolo Restrict)."
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
												{selectedType === ProductKind.Membership
													? ` (${product.membership?.duration} gg)`
													: ` (${product.entranceSet?.entranceNumber} ingressi)`}
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
					...purchase,
					clientId: values.clientId,
					date: values.date,
					amount: values.amount as unknown as PurchaseRow["amount"],
					productCode: values.productCode,
				});
			}}
			deleteAction={() => handleDelete({ id: purchase.id })}
		/>
	);
}
