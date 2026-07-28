"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractRow } from "@/data-access/contracts";
import {
	contractRequiresEndingDate,
	ENDING_DATE_BEFORE_START,
	FIXED_TERM_ENDING_DATE_REQUIRED,
	formatContractEndingDateLabel,
} from "@/lib/contract-term";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { CONTRACT_TYPE_LABEL, formatPersonLabel } from "@/lib/domain/labels";
import { formatDateIt, formatEur } from "@/lib/format";
import { Contract, ContractType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { ContractEndingDateField } from "./contract-ending-date-field";

export const formSchema = z
	.object({
		employeeId: z.number().int().positive("Devi selezionare un dipendente"),
		type: z.nativeEnum(ContractType),
		hourlyFee: z.number().positive(),
		startingDate: z.date(),
		endingDate: z.date().optional(),
	})
	.superRefine((data, ctx) => {
		if (!contractRequiresEndingDate(data.type)) {
			return;
		}
		if (!data.endingDate) {
			ctx.addIssue({
				code: "custom",
				message: FIXED_TERM_ENDING_DATE_REQUIRED,
				path: ["endingDate"],
			});
			return;
		}
		if (data.endingDate.getTime() < data.startingDate.getTime()) {
			ctx.addIssue({
				code: "custom",
				message: ENDING_DATE_BEFORE_START,
				path: ["endingDate"],
			});
		}
	});

export const columns = (
	handleDelete: (contract: Pick<Contract, "employeeId" | "startingDate">) => Promise<void>,
	handleEdit: (contract: Contract) => Promise<void>,
	loggedEmployeeId: number
): ColumnDef<ContractRow>[] => [
	{
		id: "employee",
		accessorFn: (row) => formatPersonLabel(row.employee),
		header: ({ column }) => <TableSortableHeader column={column} title="Dipendente" />,
		meta: columnMeta(ColumnClass.Join),
		cell: ({ row }) => (
			<div className="font-medium">{formatPersonLabel(row.original.employee)}</div>
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{CONTRACT_TYPE_LABEL[row.original.type]}</div>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => <TableSortableHeader column={column} title="Compenso orario" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatEur(row.original.hourlyFee)}</div>
		),
	},
	{
		accessorKey: "startingDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Data inizio" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.startingDate)}</div>
		),
	},
	{
		accessorKey: "endingDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Data fine" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">
				{formatContractEndingDateLabel(row.original.type, row.original.endingDate)}
			</div>
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
						hourlyFee: Number(row.original.hourlyFee),
					},
				}}
				formSchema={formSchema}
				editFormContent={
					<>
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
											disabled
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
												<SelectValue placeholder="Seleziona un tipo di contratto" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={ContractType.FixedTerm}>
												{CONTRACT_TYPE_LABEL.FixedTerm}
											</SelectItem>
											<SelectItem value={ContractType.OpenEnded}>
												{CONTRACT_TYPE_LABEL.OpenEnded}
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="hourlyFee"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Compenso orario</FormLabel>
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
							name="startingDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data inizio</FormLabel>
									<FormControl>
										<Input
											type="date"
											{...field}
											onChange={(e) => field.onChange(new Date(e.target.value))}
											disabled
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<ContractEndingDateField variant="input" />
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						employeeId: row.original.employeeId,
						startingDate: row.original.startingDate,
						type: values.type,
						hourlyFee: values.hourlyFee as unknown as Contract["hourlyFee"],
						endingDate:
							values.type === ContractType.OpenEnded ? null : (values.endingDate ?? null),
					});
				}}
				deleteAction={() =>
					handleDelete({
						employeeId: row.original.employeeId,
						startingDate: row.original.startingDate,
					})
				}
				editUnavailabe={row.original.employeeId === loggedEmployeeId}
				deleteUnavailabe={row.original.employeeId === loggedEmployeeId}
			/>
		),
	},
];
