"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PurchaseWithSnapshot } from "@/data-access/purchases";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import {
	PRODUCT_KIND_LABELS,
	PRODUCT_KINDS,
	type ProductKind,
} from "@/lib/domain/product-kind";
import { columnMeta } from "@/lib/domain/view-columns";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";

export type PurchaseProductOption = {
	code: string;
	membership: { duration: number } | null;
	entranceSet: { entranceNumber: number } | null;
};

export type PurchaseRow = PurchaseWithSnapshot;

/** Create/edit payload: no tipo; amount as ≤2-decimal string; snapshots set server-side. */
export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine(isValidCatalogPriceString, {
			message: "Amount must be a positive value with at most 2 decimal places",
		}),
	productCode: z.string().min(1),
});

export const columns = (
	handleDelete: (purchase: Pick<PurchaseRow, "id">) => Promise<void>,
	handleEdit: (purchase: PurchaseRow) => Promise<void>,
	filteredProducts: PurchaseProductOption[],
	onKindChange: (kind: ProductKind) => void,
	filterKind: ProductKind
): ColumnDef<PurchaseRow>[] => [
	{
		accessorKey: "id",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
	},
	{
		id: "client",
		meta: columnMeta("join"),
		accessorFn: (row) =>
			row.client
				? `${row.client.surname} ${row.client.name}`
				: String(row.clientId),
		header: ({ column }) => <TableSortableHeader column={column} title="Cliente" />,
		cell: ({ row }) => {
			const client = row.original.client;
			if (!client) {
				return <div className="font-medium">#{row.original.clientId}</div>;
			}
			return (
				<div className="font-medium">
					{client.surname} {client.name}{" "}
					<span className="text-muted-foreground text-xs">#{client.id}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "date",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Date" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "amount",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Amount (snapshot)" />
		),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("amount"));
			const formatted = new Intl.NumberFormat("it-IT", {
				style: "currency",
				currency: "EUR",
			}).format(amount);
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "productCode",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Product Code" />,
	},
	{
		accessorKey: "duration",
		meta: columnMeta("snapshot"),
		header: ({ column }) => <TableSortableHeader column={column} title="Duration (snapshot)" />,
		cell: ({ row }) => {
			const duration = row.original.duration;
			return <div className="font-medium">{duration == null ? "—" : `${duration} days`}</div>;
		},
	},
	{
		accessorKey: "entranceNumber",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Entrances (snapshot)" />
		),
		cell: ({ row }) => {
			const n = row.original.entranceNumber;
			return <div className="font-medium">{n == null ? "—" : n}</div>;
		},
	},
	{
		accessorKey: "remainingEntrances",
		meta: columnMeta("derivata"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Remaining (derived)" />
		),
		cell: ({ row }) => {
			const remaining = row.original.remainingEntrances;
			return <div className="font-medium">{remaining == null ? "—" : remaining}</div>;
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
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Tipo: UI-only product filter — not a FormField / not in formSchema */}
						<div className="space-y-2">
							<label className="text-sm font-medium leading-none">Product type filter</label>
							<Select
								value={filterKind}
								onValueChange={(value) => onKindChange(value as ProductKind)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Filter products by type" />
								</SelectTrigger>
								<SelectContent>
									{PRODUCT_KINDS.map((kind) => (
										<SelectItem key={kind} value={kind}>
											{PRODUCT_KIND_LABELS[kind]}
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
															? "No products available for selected type"
															: "Select a product"
													}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{filteredProducts.map((product) => (
												<SelectItem key={product.code} value={product.code}>
													{product.code}
													{product.membership
														? ` (${product.membership.duration} days)`
														: ` (${product.entranceSet?.entranceNumber} entrances)`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Snapshot / derived: read-only — not in formSchema / not submitted */}
						<FormItem>
							<FormLabel>Duration (sale snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.duration ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
						<FormItem>
							<FormLabel>Entrances (sale snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.entranceNumber ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
						<FormItem>
							<FormLabel>Remaining (derived from snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.remainingEntrances ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
					</>
				}
				editAction={async ({ values }) => {
					const updatedPurchase = {
						...row.original,
						...values,
						// preserve immutable snapshots from the row
						duration: row.original.duration,
						entranceNumber: row.original.entranceNumber,
					} as PurchaseRow;
					await handleEdit(updatedPurchase);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
