"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";
import { formatDateIt, formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
		.regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
		.refine((value) => Number(value) > 0, "Amount must be a positive number"),
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
		header: ({ column }) => <TableSortableHeader column={column} title="Cliente" />,
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => {
			const client = row.original.client;
			return (
				<div className="font-medium">
					{client.surname} {client.name}{" "}
					<span className="text-muted-foreground">#{client.id}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "date",
		header: ({ column }) => <TableSortableHeader column={column} title="Data" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.date)}</div>
		),
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo (snapshot)" />
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => (
			<div className="font-medium">{formatEur(row.original.amount)}</div>
		),
	},
	{
		id: "type",
		accessorFn: (row) => productKindFromSnapshot(row),
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => {
			const kind = productKindFromSnapshot(row.original);
			return <div>{PRODUCT_KIND_LABEL[kind]}</div>;
		},
		filterFn: (row, _id, value: string[]) => {
			const kind = productKindFromSnapshot(row.original);
			return value.includes(kind);
		},
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => <TableSortableHeader column={column} title="Codice prodotto" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "duration",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Durata (snapshot)" />
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => {
			const duration = row.getValue("duration") as number | null;
			return (
				<div className="text-muted-foreground">
					{duration != null ? `${duration} gg` : "—"}
				</div>
			);
		},
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="N ingressi (snapshot)" />
		),
		meta: columnMeta(ColumnClass.Snapshot),
		cell: ({ row }) => {
			const n = row.getValue("entranceNumber") as number | null;
			return <div className="text-muted-foreground">{n != null ? n : "—"}</div>;
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
								<FormLabel>Client ID</FormLabel>
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
								<FormLabel>Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn(
													"w-full pl-3 text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={field.onChange}
											disabled={(date) => date < new Date("1900-01-01")}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Tipo: solo filtro UI locale — non è FormField / non va nel payload Acquisto */}
					<div className="space-y-2">
						<Label>Type</Label>
						<Select
							value={selectedType}
							onValueChange={(value) => setSelectedType(value as ProductKind)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a type" />
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
								<FormLabel>Product</FormLabel>
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
														? `No ${PRODUCT_KIND_LABEL[selectedType].toLowerCase()} products available`
														: "Select a product"
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{filteredProducts.map((product) => (
											<SelectItem key={product.code} value={product.code}>
												{product.code}
												{selectedType === ProductKind.Membership
													? ` (${product.membership?.duration} days)`
													: ` (${product.entranceSet?.entranceNumber} entrances)`}
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
								<FormLabel>Amount</FormLabel>
								<FormControl>
									<Input
										type="text"
										inputMode="decimal"
										placeholder="0.00"
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
