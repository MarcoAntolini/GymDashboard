"use client";

import { DomainBadge, NumericCell } from "@/components/ui/domain-badge";
import { TableDateTime, TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ClockingRow } from "@/data-access/clockings";
import { inProgressBadgeSample } from "@/components/ui/data-table/table-width-samples";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { formatPersonLabel } from "@/lib/domain/labels";
import { formatDurationIt } from "@/lib/format";
import { Clocking } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
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
			<TableSortableHeader column={column} title="Dipendente" icon={ENTITY_ICON.employee} />
		),
		meta: columnMeta(ColumnClass.Join, { width: ColumnWidth.Text }),
		cell: ({ row }) => (
			<TablePerson
				person={{ ...row.original.employee, id: row.original.employeeId }}
				nameFilterKeys="employee"
			/>
		),
	},
	{
		accessorKey: "entranceTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Entrata" icon={ATTR_ICON.clockIn} />
		),
		meta: columnMeta(ColumnClass.Native, { stacked: true }),
		cell: ({ row }) => (
			<TableDateTime value={row.original.entranceTime} />
		),
	},
	{
		accessorKey: "exitTime",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Uscita" icon={ATTR_ICON.clockOut} />
		),
		meta: columnMeta(ColumnClass.Native, {
			stacked: true,
			width: ColumnWidth.Content,
			widthSamples: [inProgressBadgeSample()],
		}),
		cell: ({ row }) => {
			const exitTime = row.original.exitTime;
			return exitTime ? (
				<TableDateTime value={exitTime} />
			) : (
				<DomainBadge label="In corso" tone="info" icon={ATTR_ICON.inProgress} />
			);
		},
	},
	{
		id: "elapsedTime",
		accessorFn: (row) => {
			if (!row.exitTime) return null;
			const duration = row.exitTime.getTime() - row.entranceTime.getTime();
			return duration >= 0 ? duration : null;
		},
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Totale" icon={ATTR_ICON.duration} />
		),
		meta: columnMeta(ColumnClass.Derived, {
			width: ColumnWidth.Content,
			widthSamples: [inProgressBadgeSample()],
		}),
		cell: ({ row }) => {
			const duration = row.getValue("elapsedTime") as number | null;
			if (duration != null) {
				return (
					<NumericCell className="text-left">{formatDurationIt(duration)}</NumericCell>
				);
			}
			if (!row.original.exitTime) {
				return (
					<DomainBadge label="In corso" tone="info" icon={ATTR_ICON.inProgress} />
				);
			}
			return <NumericCell muted className="text-left">—</NumericCell>;
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
