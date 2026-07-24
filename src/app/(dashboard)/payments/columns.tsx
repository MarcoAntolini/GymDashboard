"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PaymentRow } from "@/data-access/payments";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import { formatCurrencyEur, formatDateIt } from "@/lib/format/locale";
import {
	formatPaymentTypeLabel,
	paymentSpecialtyDetailLines,
	formatPaymentSpecialtySummary,
} from "@/lib/format/payment-specialty";
import { PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	date: z.date(),
	amount: z
		.string()
		.min(1, "Importo obbligatorio")
		.refine(isValidCatalogPriceString, {
			message: "Importo positivo con al massimo 2 decimali",
		}),
	type: z.nativeEnum(PaymentType),
});

export const columns = (
	handleDelete: (payment: Pick<PaymentRow, "id">) => Promise<void>,
	handleEdit: (payment: PaymentRow) => Promise<void>
): ColumnDef<PaymentRow>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="ID"
			/>
		),
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Data"
			/>
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{formatDateIt(date)}</div>;
		},
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Importo"
			/>
		),
		cell: ({ row }) => {
			const amount = row.getValue("amount") as string;
			return <div className="font-medium">{formatCurrencyEur(amount)}</div>;
		},
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Tipo"
			/>
		),
		cell: ({ row }) => (
			<div className="font-medium">
				{formatPaymentTypeLabel(row.original.type)}
			</div>
		),
	},
	{
		id: "specialty",
		enableSorting: false,
		header: () => <div>Dettaglio</div>,
		cell: ({ row }) => (
			<div className="max-w-[28rem] text-sm text-muted-foreground">
				{formatPaymentSpecialtySummary(row.original)}
			</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const specialtyLines = paymentSpecialtyDetailLines(row.original);
			return (
				<ItemActions
					row={row}
					formSchema={formSchema}
					entityLabel="Pagamento"
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
												value={
													field.value
														? new Date(field.value).toISOString().split("T")[0]
														: ""
												}
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
											<Input type="text" inputMode="decimal" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo</FormLabel>
										<FormControl>
											<Input
												disabled
												readOnly
												value={formatPaymentTypeLabel(field.value)}
												aria-readonly="true"
											/>
										</FormControl>
										<p className="text-sm text-muted-foreground">
											Il tipo non è modificabile: la specializzazione nasce solo in
											creazione. Per un tipo diverso registra un nuovo Pagamento.
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="space-y-3 rounded-md border border-border p-3">
								<p className="text-sm font-medium">Specializzazione</p>
								{specialtyLines.map((line) => (
									<div key={line.label} className="space-y-1">
										<p className="text-xs text-muted-foreground">{line.label}</p>
										<p className="text-sm font-medium">{line.value}</p>
									</div>
								))}
								<p className="text-xs text-muted-foreground">
									I campi della specializzazione non si modificano qui: usa le liste
									Uscite (Stipendi, Bollette, Attrezzatura, Interventi) se serve
									correggerli.
								</p>
							</div>
						</>
					}
					editAction={async ({ values }) => {
						const updatedPayment = {
							...row.original,
							...values,
							type: row.original.type,
						};
						await handleEdit(updatedPayment);
					}}
					deleteAction={() => handleDelete({ id: row.original.id })}
				/>
			);
		},
	},
];
