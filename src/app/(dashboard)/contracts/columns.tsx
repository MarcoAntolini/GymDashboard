"use client";

import {
	DomainBadge,
	DotBadge,
	MoneyTone,
	NumericCell,
} from "@/components/ui/domain-badge";
import { TableDate, TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractRow } from "@/data-access/contracts";
import {
	contractRequiresEndingDate,
	ENDING_DATE_BEFORE_START,
	FIXED_TERM_ENDING_DATE_REQUIRED,
} from "@/lib/contract-term";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { CONTRACT_TYPE_LABEL, formatPersonLabel } from "@/lib/domain/labels";
import { CONTRACT_TYPE_ICON, CONTRACT_TYPE_TONE } from "@/lib/domain/visual";
import { formatEur } from "@/lib/format";
import { Contract, ContractType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={ENTITY_ICON.employee} />
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
		accessorKey: "type",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={ATTR_ICON.type} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<DotBadge
				label={CONTRACT_TYPE_LABEL[row.original.type]}
				icon={CONTRACT_TYPE_ICON[row.original.type]}
				tone={CONTRACT_TYPE_TONE[row.original.type]}
			/>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Compenso orario" icon={ATTR_ICON.amount} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<NumericCell>
				<MoneyTone tone="expense">{formatEur(row.original.hourlyFee)}</MoneyTone>
			</NumericCell>
		),
	},
	{
		accessorKey: "startingDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data inizio" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.startingDate} />,
	},
	{
		accessorKey: "endingDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data fine" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => {
			const endingDate = row.original.endingDate;
			const open =
				row.original.type === ContractType.OpenEnded || endingDate == null;
			if (open || endingDate == null) {
				return <DomainBadge label="In corso" tone="info" icon={ATTR_ICON.inProgress} />;
			}
			return <TableDate value={endingDate} />;
		},
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
				entityLabel="Contratto"
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
												{CONTRACT_TYPE_LABEL[ContractType.FixedTerm]}
											</SelectItem>
											<SelectItem value={ContractType.OpenEnded}>
												{CONTRACT_TYPE_LABEL[ContractType.OpenEnded]}
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
											className="text-right tabular-nums"
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
									<FormDateField value={field.value} onChange={field.onChange} disabled />
									<FormMessage />
								</FormItem>
							)}
						/>
						<ContractEndingDateField variant="calendar" />
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
