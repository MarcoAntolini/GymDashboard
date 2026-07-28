"use client";

import {
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HighlightText } from "@/components/ui/highlight-text";
import { Input } from "@/components/ui/input";
import type { InterventionRow } from "@/data-access/interventions";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateIt, formatDateTimeIt, formatEur } from "@/lib/format";
import { Intervention } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Calendar, Clock, FileText, Hash, User } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	description: z.string().min(1),
	maker: z.string().min(1),
	startingTime: z.date(),
	endingTime: z.date(),
});

export const columns = (
	handleDelete: (intervention: Pick<Intervention, "paymentId">) => Promise<void>,
	handleEdit: (intervention: Intervention) => Promise<void>
): ColumnDef<InterventionRow>[] => [
	{
		accessorKey: "maker",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Attuatore" icon={User} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Descrizione" icon={FileText} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "startingTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Inizio" icon={Clock} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateTimeIt(row.original.startingTime)}</div>
		),
	},
	{
		accessorKey: "endingTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Fine" icon={Clock} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateTimeIt(row.original.endingTime)}</div>
		),
	},
	{
		id: "paymentDate",
		accessorFn: (row) => row.payment.date,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data pagamento" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.payment.date)}</div>
		),
	},
	{
		id: "paymentAmount",
		accessorFn: (row) => Number(row.payment.amount),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo" icon={Banknote} align="right" />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="expense">{formatEur(row.original.payment.amount)}</MoneyTone>
			</NumericCell>
		),
	},
	{
		accessorKey: "paymentId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID Pagamento" icon={Hash} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">
				<HighlightText text={String(row.original.paymentId)} filterKeys="paymentId" />
			</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Intervento"
				editFormContent={
					<>
						<FormField
							name="paymentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Pagamento</FormLabel>
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrizione</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="maker"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Attuatore</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="startingTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Inizio</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
											onChange={(e) => field.onChange(new Date(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="endingTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fine</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
											onChange={(e) => field.onChange(new Date(e.target.value))}
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
						paymentId: row.original.paymentId,
						description: values.description,
						maker: values.maker,
						startingTime: values.startingTime,
						endingTime: values.endingTime,
					});
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
