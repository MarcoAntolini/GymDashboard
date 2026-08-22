"use client";

import {
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import { TableDate, TableId, TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { SalaryRow } from "@/data-access/salaries";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatPersonLabel } from "@/lib/domain/labels";
import { formatEur } from "@/lib/format";
import { Salary } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Calendar, Hash, User } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	paymentId: z.number().int().positive(),
	employeeId: z.number().int().positive(),
});

export const columns = (
	handleDelete: (salary: Pick<Salary, "paymentId">) => Promise<void>,
	handleEdit: (salary: Salary) => Promise<void>
): ColumnDef<SalaryRow>[] => [
	{
		id: "employee",
		accessorFn: (row) => formatPersonLabel(row.employee),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={User} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<TablePerson
				person={{ ...row.original.employee, id: row.original.employeeId }}
				nameFilterKeys="employee"
			/>
		),
	},
	{
		id: "paymentDate",
		accessorFn: (row) => row.payment.date,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data pagamento" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => <TableDate value={row.original.payment.date} />,
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
			<TableId value={row.original.paymentId} filterKeys="paymentId" />
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Stipendio"
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
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Dipendente</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											onChange={(e) => field.onChange(parseInt(e.target.value))}
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
						employeeId: values.employeeId,
					});
				}}
				deleteAction={() => handleDelete({ paymentId: row.original.paymentId })}
			/>
		),
	},
];
