"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { ProductKindBadge, type ProductKindKey } from "@/components/ui/domain-badge";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EntranceWithPurchase } from "@/data-access/entrances";
import { formatDateTimeIt, personLabel } from "@/lib/format";
import { Entrance } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Hash, Link2, Package, UserRound } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	clientId: z.number().int().positive("Seleziona un Cliente"),
	date: z.date()
});

export const editFormSchema = z.object({
	id: z.number().int().positive(),
	date: z.date()
});

function clientLabel(row: EntranceWithPurchase): string {
	return personLabel(row.purchase?.client);
}

function productKindOf(row: EntranceWithPurchase): ProductKindKey | null {
	if (row.purchase?.membershipDuration != null || row.purchase?.prodotto?.membership) {
		return "Membership";
	}
	if (row.purchase?.entranceNumber != null || row.purchase?.prodotto?.entranceSet) {
		return "EntranceSet";
	}
	return null;
}

function productLabel(row: EntranceWithPurchase): string {
	const code = row.purchase?.productCode ?? row.purchase?.prodotto?.code;
	if (!code) return "—";
	const kind = productKindOf(row);
	if (kind === "Membership") {
		const days = row.purchase?.membershipDuration;
		return days != null ? `${code} (Abbonamento, ${days}g snapshot)` : `${code} (Abbonamento)`;
	}
	if (kind === "EntranceSet") {
		const n = row.purchase?.entranceNumber;
		return n != null ? `${code} (Pacchetto, N=${n} snapshot)` : `${code} (Pacchetto)`;
	}
	return code;
}

function purchaseJustificationLabel(row: EntranceWithPurchase): string {
	const kind =
		row.purchase?.membershipDuration != null
			? "Abbonamento"
			: row.purchase?.entranceNumber != null
				? "Pacchetto"
				: row.purchase?.prodotto?.membership
					? "Abbonamento"
					: row.purchase?.prodotto?.entranceSet
						? "Pacchetto"
						: null;
	const code = row.purchase?.productCode ?? row.purchase?.prodotto?.code;
	if (!row.purchaseId) return "—";
	if (kind === "Abbonamento" && code) {
		const days = row.purchase?.membershipDuration;
		return days != null
			? `#${row.purchaseId} · ${kind} ${code} (${days}g)`
			: `#${row.purchaseId} · ${kind} ${code}`;
	}
	if (kind === "Pacchetto" && code) {
		const n = row.purchase?.entranceNumber;
		return n != null
			? `#${row.purchaseId} · ${kind} ${code} (N=${n})`
			: `#${row.purchaseId} · ${kind} ${code}`;
	}
	return `#${row.purchaseId}`;
}

export const columns = (
	handleDelete: (entrance: Pick<Entrance, "id">) => Promise<void>,
	handleEdit: (entrance: EntranceWithPurchase) => Promise<void>
): ColumnDef<EntranceWithPurchase>[] => [
	{
		id: "client",
		accessorFn: (row) => clientLabel(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={UserRound} />
		),
		cell: ({ row }) => <div>{clientLabel(row.original)}</div>
	},
	{
		id: "product",
		accessorFn: (row) => productLabel(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={Package} />
		),
		cell: ({ row }) => {
			const code = row.original.purchase?.productCode ?? row.original.purchase?.prodotto?.code;
			const kind = productKindOf(row.original);
			if (!code) return <div>—</div>;
			return (
				<div className="flex min-w-0 items-center gap-2">
					<span className="font-medium">{code}</span>
					{kind ? <ProductKindBadge kind={kind} /> : null}
				</div>
			);
		}
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data e ora" icon={CalendarClock} />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{formatDateTimeIt(row.getValue("date"))}</div>;
		}
	},
	{
		id: "purchase",
		accessorFn: (row) => purchaseJustificationLabel(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Acquisto (giustificazione)" icon={Link2} />
		),
		cell: ({ row }) => (
			<div title="Acquisto che giustifica questo Ingresso">
				{purchaseJustificationLabel(row.original)}
			</div>
		)
	},
	{
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		)
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={editFormSchema}
				entityLabel="Ingresso"
				deleteDescription="L'eliminazione di questo Ingresso non può essere annullata. L'Acquisto collegato resta; il residuo Pacchetto (se presente) si ricalcola."
				editFormContent={
					<>
						<FormField
							name="id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID</FormLabel>
									<FormControl>
										<Input type="number" {...field} disabled />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-pretty">
							<p>
								Cliente: {clientLabel(row.original)} · Giustificazione attuale:{" "}
								{purchaseJustificationLabel(row.original)}
							</p>
							<p className="mt-1 text-muted-foreground">
								Cambiando data/ora, l&apos;Acquisto giustificante viene ricalcolato con le stesse
								regole di priorità (Abbonamento → Pacchetto FIFO).
							</p>
						</div>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data e ora</FormLabel>
									<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedEntrance: EntranceWithPurchase = {
						...row.original,
						date: new Date(values.date)
					};
					await handleEdit(updatedEntrance);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		)
	}
];
