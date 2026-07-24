"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DomainBadge } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MoneyTone } from "@/components/ui/money-tone";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PurchaseWithSnapshot } from "@/data-access/purchases";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import { columnMeta } from "@/lib/domain/view-columns";
import { remainingEntrancesVisual } from "@/lib/format/domain-visuals";
import { formatCurrencyEur, formatDateIt } from "@/lib/format/locale";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import {
	CalendarDays,
	CalendarIcon,
	Coins,
	Hash,
	Package,
	Ticket,
	UserRound,
} from "lucide-react";
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
		.min(1, "Importo obbligatorio")
		.refine(isValidCatalogPriceString, {
			message: "Importo positivo con al massimo 2 decimali",
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		),
	},
	{
		id: "client",
		meta: columnMeta("join"),
		accessorFn: (row) =>
			row.client
				? `${row.client.surname} ${row.client.name}`
				: String(row.clientId),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={UserRound} />
		),
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={CalendarDays} />
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{formatDateIt(date)}</div>;
		},
	},
	{
		accessorKey: "amount",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Importo"
				icon={Coins}
				align="right"
			/>
		),
		cell: ({ row }) => {
			const amount = row.getValue("amount") as string;
			return <MoneyTone amount={amount} direction="income" />;
		},
	},
	{
		accessorKey: "productCode",
		meta: columnMeta("nativa"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={Package} />
		),
	},
	{
		accessorKey: "duration",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Durata (gg)"
				icon={CalendarDays}
				align="right"
			/>
		),
		cell: ({ row }) => {
			const duration = row.original.duration;
			return (
				<div className="text-right font-medium tabular-nums">
					{duration == null ? "—" : `${duration} gg`}
				</div>
			);
		},
	},
	{
		accessorKey: "entranceNumber",
		meta: columnMeta("snapshot"),
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Ingressi (N)"
				icon={Ticket}
				align="right"
			/>
		),
		cell: ({ row }) => {
			const n = row.original.entranceNumber;
			return (
				<div className="text-right font-medium tabular-nums">
					{n == null ? "—" : n}
				</div>
			);
		},
	},
	{
		accessorKey: "remainingEntrances",
		meta: columnMeta("derivata"),
		enableSorting: false,
		header: () => (
			<TableSortableHeader title="Residuo" icon={Ticket} align="right" />
		),
		cell: ({ row }) => {
			const remaining = row.original.remainingEntrances;
			const visual = remainingEntrancesVisual(remaining);
			if (!visual) {
				return <div className="text-right text-muted-foreground">—</div>;
			}
			return (
				<div
					className="flex justify-end"
					title="Derivato da N snapshot − Ingressi su questo Acquisto"
				>
					<DomainBadge
						label={visual.label}
						tone={visual.tone}
						icon={visual.icon}
					/>
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const remainingVisual = remainingEntrancesVisual(
				row.original.remainingEntrances
			);
			return (
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
														{field.value ? (
															formatDateIt(field.value)
														) : (
															<span>Scegli una data</span>
														)}
														<CalendarIcon className="ml-auto size-4 opacity-50" />
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
							<div className="flex flex-col gap-3 rounded-md border border-border p-3">
								<p className="text-sm font-medium">Snapshot di vendita</p>
								<p className="text-xs text-muted-foreground">
									Importo, durata e N sono fissati alla vendita (dal Listino dell&apos;anno o
									override). Il residuo pacchetto è derivato sull&apos;Acquisto, non sul Cliente.
								</p>
								<FormItem>
									<FormLabel>Prodotto (immutabile)</FormLabel>
									<FormControl>
										<Input value={row.original.productCode} disabled readOnly />
									</FormControl>
								</FormItem>
								<FormItem>
									<FormLabel>Importo (snapshot)</FormLabel>
									<div className="flex items-center justify-between gap-2">
										<MoneyTone
											amount={row.original.amount}
											direction="income"
											className="text-sm"
										/>
										<span className="sr-only">
											{formatCurrencyEur(row.original.amount)}
										</span>
									</div>
								</FormItem>
								<FormItem>
									<FormLabel>Durata gg (snapshot)</FormLabel>
									<p className="text-right text-sm font-medium tabular-nums">
										{row.original.duration ?? "—"}
									</p>
								</FormItem>
								<FormItem>
									<FormLabel>Ingressi N (snapshot)</FormLabel>
									<p className="text-right text-sm font-medium tabular-nums">
										{row.original.entranceNumber ?? "—"}
									</p>
								</FormItem>
								<FormItem>
									<FormLabel>Residuo (derivato)</FormLabel>
									{remainingVisual ? (
										<DomainBadge
											label={remainingVisual.label}
											tone={remainingVisual.tone}
											icon={remainingVisual.icon}
										/>
									) : (
										<span className="text-sm text-muted-foreground">—</span>
									)}
								</FormItem>
							</div>
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
			);
		},
	},
];
