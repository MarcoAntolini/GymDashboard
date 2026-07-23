"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PaymentDTO } from "@/data-access/payments";
import {
	formatCurrencyEur,
	formatDateIt,
	formatDateTimeIt,
	paymentTypeLabel,
	personLabel,
} from "@/lib/format";
import { PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	date: z.date(),
	amount: z.number().positive("L'importo deve essere positivo"),
	type: z.nativeEnum(PaymentType),
});

/** Display-only detail; search hits specialization fields via `listPayments`. */
function paymentDetail(payment: PaymentDTO): string {
	switch (payment.type) {
		case PaymentType.Salary:
			return payment.salary
				? `Dipendente ${personLabel(payment.salary.employee)}`
				: "Stipendio senza Dipendente";
		case PaymentType.Bill:
			return payment.bill
				? `Fornitore: ${payment.bill.provider} · Descrizione: ${payment.bill.description}`
				: "Bolletta incompleta";
		case PaymentType.Equipment:
			return payment.equipment
				? `Fornitore: ${payment.equipment.provider} · Descrizione: ${payment.equipment.description}`
				: "Attrezzatura incompleta";
		case PaymentType.Intervention:
			if (!payment.intervention) return "Intervento incompleto";
			return [
				`Attuatore: ${payment.intervention.maker}`,
				`Descrizione: ${payment.intervention.description}`,
				`Inizio: ${formatDateTimeIt(payment.intervention.startingTime)}`,
				`Fine: ${formatDateTimeIt(payment.intervention.endingTime)}`,
			].join(" · ");
		default:
			return "—";
	}
}

export const columns = (
	handleDelete: (payment: Pick<PaymentDTO, "id">) => Promise<void>,
	handleEdit: (payment: PaymentDTO) => Promise<void>
): ColumnDef<PaymentDTO>[] => [
	{
		accessorKey: "date",
		header: ({ column }) => <TableSortableHeader column={column} title="Data" />,
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.getValue("date"))}</div>
		),
	},
	{
		id: "typeLabel",
		accessorFn: (row) => paymentTypeLabel[row.type],
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		cell: ({ row }) => (
			<div className="font-medium">{paymentTypeLabel[row.original.type]}</div>
		),
	},
	{
		accessorKey: "amount",
		header: ({ column }) => <TableSortableHeader column={column} title="Importo" />,
		cell: ({ row }) => (
			<div className="font-medium tabular-nums">
				{formatCurrencyEur(row.getValue("amount"))}
			</div>
		),
	},
	{
		id: "detail",
		accessorFn: (row) => paymentDetail(row),
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dettaglio tipizzato" />
		),
		cell: ({ row }) => {
			const detail = paymentDetail(row.original);
			return (
				<div
					className="max-w-[32rem] whitespace-normal text-sm leading-snug text-pretty line-clamp-2"
					title={detail}
				>
					{detail}
				</div>
			);
		},
	},
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
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
						<FormField
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleziona un tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
										{(
											[
												PaymentType.Salary,
												PaymentType.Bill,
												PaymentType.Equipment,
												PaymentType.Intervention,
											] as const
										).map((type) => (
											<SelectItem key={type} value={type}>
												{paymentTypeLabel[type]}
											</SelectItem>
										))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						...row.original,
						...values,
					});
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
