"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PurchaseWithSnapshot } from "@/data-access/purchases";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import { columnMeta } from "@/lib/domain/view-columns";
import { formatCurrencyEur, formatDateIt } from "@/lib/format/locale";
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

/** Create payload: amount optional override; snapshots durata/N set server-side. */
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

/** Update payload: only mutable fields (snapshots + productCode immutable after sale). */
export const editFormSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
});

export const columns = (
	handleDelete: (purchase: Pick<PurchaseRow, "id">) => Promise<void>,
	handleEdit: (purchase: PurchaseRow) => Promise<void>
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
		header: ({ column }) => <TableSortableHeader column={column} title="Data" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{formatDateIt(date)}</div>;
		},
	},
	{
		accessorKey: "amount",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo" />
		),
		cell: ({ row }) => {
			const amount = row.getValue("amount") as string;
			return <div className="font-medium">{formatCurrencyEur(amount)}</div>;
		},
	},
	{
		accessorKey: "productCode",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Prodotto" />,
	},
	{
		accessorKey: "duration",
		meta: columnMeta("snapshot"),
		header: ({ column }) => <TableSortableHeader column={column} title="Durata (gg)" />,
		cell: ({ row }) => {
			const duration = row.original.duration;
			return <div className="font-medium">{duration == null ? "—" : `${duration} gg`}</div>;
		},
	},
	{
		accessorKey: "entranceNumber",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Ingressi (N)" />
		),
		cell: ({ row }) => {
			const n = row.original.entranceNumber;
			return <div className="font-medium">{n == null ? "—" : n}</div>;
		},
	},
	{
		accessorKey: "remainingEntrances",
		meta: columnMeta("derivata"),
		enableSorting: false,
		header: () => <div>Residuo</div>,
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
				formSchema={editFormSchema}
				entityLabel="Acquisto"
				deleteConsequence="Impossibile eliminare l'Acquisto se esistono Ingressi collegati (vincolo Restrict)."
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
						{/* Snapshot / product identity: read-only — not in editFormSchema */}
						<FormItem>
							<FormLabel>Product (immutable after sale)</FormLabel>
							<FormControl>
								<Input value={row.original.productCode} disabled readOnly />
							</FormControl>
						</FormItem>
						<FormItem>
							<FormLabel>Amount (sale snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.amount} disabled readOnly />
							</FormControl>
						</FormItem>
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
						clientId: values.clientId,
						date: values.date,
					} as PurchaseRow;
					await handleEdit(updatedPurchase);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
