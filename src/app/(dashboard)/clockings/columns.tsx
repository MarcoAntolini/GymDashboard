"use client";

import { DomainBadge } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HighlightText } from "@/components/ui/highlight-text";
import { Input } from "@/components/ui/input";
import type { ClockingRow } from "@/data-access/clockings";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatPersonLabel } from "@/lib/domain/labels";
import { formatDateTimeIt } from "@/lib/format";
import { Clocking } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { CirclePlay, LogIn, LogOut, User } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	employeeId: z.number().int().positive(),
	entranceTime: z.date(),
	exitTime: z.date().optional(),
});

export const columns = (
	handleDelete: (clocking: Pick<Clocking, "employeeId" | "entranceTime">) => Promise<void>,
	handleEdit: (clocking: Clocking) => Promise<void>
): ColumnDef<ClockingRow>[] => [
	{
		id: "employee",
		accessorFn: (row) => formatPersonLabel(row.employee),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={User} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">
				<HighlightText
					text={formatPersonLabel(row.original.employee)}
					filterKeys="employee"
				/>
			</div>
		),
	},
	{
		accessorKey: "entranceTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Entrata" icon={LogIn} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateTimeIt(row.original.entranceTime)}</div>
		),
	},
	{
		accessorKey: "exitTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Uscita" icon={LogOut} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => {
			const exitTime = row.original.exitTime;
			return exitTime ? (
				<div className="font-medium">{formatDateTimeIt(exitTime)}</div>
			) : (
				<DomainBadge label="In corso" tone="info" icon={CirclePlay} />
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Timbratura"
				editFormContent={
					<>
						<FormField
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Dipendente</FormLabel>
									<FormControl>
										<Input type="number" {...field} disabled />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="entranceTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Entrata</FormLabel>
									<DateTimePicker field={field} onChange={(date) => field.onChange(date)} disabled={true} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="exitTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Uscita</FormLabel>
									<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						employeeId: row.original.employeeId,
						entranceTime: row.original.entranceTime,
						exitTime: values.exitTime ?? null,
					});
				}}
				deleteAction={() =>
					handleDelete({
						employeeId: row.original.employeeId,
						entranceTime: row.original.entranceTime,
					})
				}
			/>
		),
	},
];
