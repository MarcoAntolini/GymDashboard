"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PaymentRow } from "@/data-access/payments";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { formatDateIt, formatDateTimeIt, formatEur } from "@/lib/format";
import { PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	date: z.date(),
	amount: z.number().positive("L'importo deve essere un numero positivo"),
	type: z.nativeEnum(PaymentType),
});

function specializationSummary(payment: PaymentRow): string {
	switch (payment.type) {
		case "Salary":
			return payment.salary
				? `Dipendente #${payment.salary.employeeId}`
				: "Specializzazione assente";
		case "Bill":
			return payment.bill
				? `${payment.bill.provider} — ${payment.bill.description}`
				: "Specializzazione assente";
		case "Equipment":
			return payment.equipment
				? `${payment.equipment.provider} — ${payment.equipment.description}`
				: "Specializzazione assente";
		case "Intervention":
			return payment.intervention
				? `${payment.intervention.maker} — ${payment.intervention.description}`
				: "Specializzazione assente";
		default:
			return "—";
	}
}

function PaymentSpecializationDetails({ payment }: { payment: PaymentRow }) {
	switch (payment.type) {
		case "Salary":
			return (
				<FormItem>
					<FormLabel>Specializzazione — Stipendio</FormLabel>
					<p className="text-sm text-muted-foreground">
						{payment.salary
							? `ID Dipendente: ${payment.salary.employeeId}`
							: "Dati specializzazione non disponibili."}
					</p>
				</FormItem>
			);
		case "Bill":
			return (
				<FormItem>
					<FormLabel>Specializzazione — Bolletta</FormLabel>
					{payment.bill ? (
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>Fornitore: {payment.bill.provider}</li>
							<li>Descrizione: {payment.bill.description}</li>
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">Dati specializzazione non disponibili.</p>
					)}
				</FormItem>
			);
		case "Equipment":
			return (
				<FormItem>
					<FormLabel>Specializzazione — Attrezzatura</FormLabel>
					{payment.equipment ? (
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>Fornitore: {payment.equipment.provider}</li>
							<li>Descrizione: {payment.equipment.description}</li>
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">Dati specializzazione non disponibili.</p>
					)}
				</FormItem>
			);
		case "Intervention":
			return (
				<FormItem>
					<FormLabel>Specializzazione — Intervento</FormLabel>
					{payment.intervention ? (
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>Produttore: {payment.intervention.maker}</li>
							<li>Descrizione: {payment.intervention.description}</li>
							<li>Inizio: {formatDateTimeIt(payment.intervention.startingTime)}</li>
							<li>Fine: {formatDateTimeIt(payment.intervention.endingTime)}</li>
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">Dati specializzazione non disponibili.</p>
					)}
				</FormItem>
			);
		default:
			return null;
	}
}

export const columns = (
	handleDelete: (payment: Pick<PaymentRow, "id">) => Promise<void>,
	handleEdit: (payment: {
		id: number;
		date: Date;
		amount: PaymentRow["amount"] | number;
		type: PaymentType;
	}) => Promise<void>
): ColumnDef<PaymentRow>[] => [
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
		header: ({ column }) => <TableSortableHeader column={column} title="Importo" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatEur(row.original.amount)}</div>
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div>{PAYMENT_TYPE_LABEL[row.original.type]}</div>
		),
	},
	{
		id: "specialization",
		accessorFn: (row) => specializationSummary(row),
		header: ({ column }) => <TableSortableHeader column={column} title="Dettaglio" />,
		meta: columnMeta(ColumnClass.Join),
		enableSorting: false,
		cell: ({ row }) => (
			<div className="max-w-[280px] truncate text-muted-foreground" title={specializationSummary(row.original)}>
				{specializationSummary(row.original)}
			</div>
		),
	},
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.id}</div>
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
						amount: Number(row.original.amount),
					},
				}}
				formSchema={formSchema}
				entityLabel="Pagamento"
				editDescription="Modifica data e importo. Il tipo e i campi della specializzazione non sono modificabili da qui — ispezionali sotto."
				deleteDescription="Eliminando il Pagamento verranno eliminate anche le specializzazioni collegate (Stipendio, Bolletta, Attrezzatura o Intervento)."
				editFormContent={
					<>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data</FormLabel>
									<FormControl>
										<Input
											type="date"
											{...field}
											value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
											onChange={(e) => field.onChange(new Date(e.target.value))}
										/>
									</FormControl>
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
											type="number"
											step="0.01"
											{...field}
											onChange={(e) => field.onChange(parseFloat(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormItem>
							<FormLabel>Tipo</FormLabel>
							<p className="text-sm text-muted-foreground">
								{PAYMENT_TYPE_LABEL[row.original.type]} (bloccato — crea un nuovo Pagamento per
								cambiare tipo)
							</p>
						</FormItem>
						<PaymentSpecializationDetails payment={row.original} />
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						id: row.original.id,
						date: values.date,
						amount: values.amount,
						type: row.original.type,
					});
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
