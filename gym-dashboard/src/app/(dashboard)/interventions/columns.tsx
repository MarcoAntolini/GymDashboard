"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Intervention } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateTimeIt } from "@/lib/format";
import { CalendarClock, FileText, Hash, UserRound } from "lucide-react";
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
): ColumnDef<Intervention>[] => [
	{
		accessorKey: "paymentId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Pagamento" icon={Hash} />
		),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Descrizione" icon={FileText} />
		),
	},
	{
		accessorKey: "maker",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Attuatore" icon={UserRound} />
		),
	},
	{
		accessorKey: "startingTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Inizio" icon={CalendarClock} />
		),
		cell: ({ row }) => {
			return (
				<div className="font-medium">{formatDateTimeIt(row.getValue("startingTime"))}</div>
			);
		},
	},
	{
		accessorKey: "endingTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Fine" icon={CalendarClock} />
		),
		cell: ({ row }) => {
			return (
				<div className="font-medium">{formatDateTimeIt(row.getValue("endingTime"))}</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Intervento"
				deleteDescription="Elimina l'Intervento collegato al Pagamento. Preferisci gestire creazione e tipo da Pagamenti. L'operazione non può essere annullata."
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
					const updatedIntervention = {
						...row.original,
						...values,
					};
					await handleEdit(updatedIntervention);
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
