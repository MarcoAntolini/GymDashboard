"use client";

import {
	DotBadge,
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import { TableDate, TableId } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PaymentRow } from "@/data-access/payments";
import { LONG_TEXT_COLUMN_SIZE } from "@/components/ui/data-table/table-column-layout";
import {
	paymentTypeBadgeSamples,
	tableDateSamples,
} from "@/components/ui/data-table/table-width-samples";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { PAYMENT_TYPE_ICON, PAYMENT_TYPE_TONE } from "@/lib/domain/visual";
import { formatDateTimeIt, formatEur } from "@/lib/format";
import { PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { z } from "zod";

export const formSchema = z.object({
	date: z.date(),
	amount: z.number().positive("L'importo deve essere un numero positivo"),
	type: z.nativeEnum(PaymentType),
});

function specializationSummary(payment: PaymentRow): string {
	switch (payment.type) {
		case PaymentType.Salary:
			return payment.salary
				? `Dipendente #${payment.salary.employeeId}`
				: "Specializzazione assente";
		case PaymentType.Bill:
			return payment.bill
				? `${payment.bill.provider} — ${payment.bill.description}`
				: "Specializzazione assente";
		case PaymentType.Equipment:
			return payment.equipment
				? `${payment.equipment.provider} — ${payment.equipment.description}`
				: "Specializzazione assente";
		case PaymentType.Intervention:
			return payment.intervention
				? `${payment.intervention.maker} — ${payment.intervention.description}`
				: "Specializzazione assente";
		default:
			return "—";
	}
}

function PaymentSpecializationDetails({ payment }: { payment: PaymentRow }) {
	switch (payment.type) {
		case PaymentType.Salary:
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
		case PaymentType.Bill:
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
		case PaymentType.Equipment:
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
		case PaymentType.Intervention:
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
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={ATTR_ICON.id} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.id} filterKeys="id" />
		),
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native, {
			width: ColumnWidth.Content,
			widthSamples: tableDateSamples(),
		}),
		cell: ({ row }) => <TableDate value={row.original.date} />,
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo" icon={ATTR_ICON.amount} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="expense">{formatEur(row.original.amount)}</MoneyTone>
			</NumericCell>
		),
	},
	{
		accessorKey: "type",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={ATTR_ICON.type} />
		),
		meta: columnMeta(ColumnClass.Native, {
			width: ColumnWidth.Content,
			widthSamples: paymentTypeBadgeSamples(),
		}),
		cell: ({ row }) => (
			<DotBadge
				label={PAYMENT_TYPE_LABEL[row.original.type]}
				icon={PAYMENT_TYPE_ICON[row.original.type]}
				tone={PAYMENT_TYPE_TONE[row.original.type]}
			/>
		),
	},
	{
		id: "specialization",
		accessorFn: (row) => specializationSummary(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dettaglio" icon={ATTR_ICON.description} />
		),
		meta: columnMeta(ColumnClass.Join, { width: ColumnWidth.Text }),
		size: LONG_TEXT_COLUMN_SIZE,
		enableSorting: false,
		cell: ({ row }) => (
			<div className="text-muted-foreground">{specializationSummary(row.original)}</div>
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
									<FormDateField
										value={field.value}
										onChange={field.onChange}
										disabledDates={(date) => date < new Date("1900-01-01")}
									/>
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
											className="text-right tabular-nums"
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
							<div className="pt-1">
								<DotBadge
									label={PAYMENT_TYPE_LABEL[row.original.type]}
									icon={PAYMENT_TYPE_ICON[row.original.type]}
									tone={PAYMENT_TYPE_TONE[row.original.type]}
								/>
								<p className="mt-1.5 text-sm text-muted-foreground">
									Bloccato — crea un nuovo Pagamento per cambiare tipo
								</p>
							</div>
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
