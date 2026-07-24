"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractRow } from "@/data-access/contracts";
import { isValidCatalogPriceString } from "@/lib/domain/catalog-price";
import {
	CONTRACT_ENDING_DATE_BEFORE_START_ERROR,
	CONTRACT_ENDING_DATE_REQUIRED_ERROR,
	formatContractEndingDateDisplay,
	isFixedTermContract,
} from "@/lib/domain/contract-term";
import { columnMeta } from "@/lib/domain/view-columns";
import { formatCurrencyEur, formatDateIt } from "@/lib/format/locale";
import { ContractType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { ContractEndingDateField } from "./contract-ending-date-field";

export const formSchema = z
	.object({
		employeeId: z.number().int().positive("Must select an employee"),
		type: z.nativeEnum(ContractType),
		hourlyFee: z
			.string()
			.min(1, "Hourly fee is required")
			.refine(isValidCatalogPriceString, {
				message: "Hourly fee must be a positive value with at most 2 decimal places",
			}),
		startingDate: z.date(),
		endingDate: z.date().optional(),
	})
	.superRefine((data, ctx) => {
		if (!isFixedTermContract(data.type)) {
			return;
		}
		if (!data.endingDate) {
			ctx.addIssue({
				code: "custom",
				message: CONTRACT_ENDING_DATE_REQUIRED_ERROR,
				path: ["endingDate"],
			});
			return;
		}
		if (data.endingDate.getTime() < data.startingDate.getTime()) {
			ctx.addIssue({
				code: "custom",
				message: CONTRACT_ENDING_DATE_BEFORE_START_ERROR,
				path: ["endingDate"],
			});
		}
	});

export const columns = (
	handleDelete: (contract: Pick<ContractRow, "employeeId" | "startingDate">) => Promise<void>,
	handleEdit: (contract: ContractRow) => Promise<void>,
	loggedEmployeeId: number
): ColumnDef<ContractRow>[] => [
	{
		id: "employee",
		meta: columnMeta("join"),
		accessorFn: (row) =>
			row.employee
				? `${row.employee.surname} ${row.employee.name}`
				: String(row.employeeId),
		header: ({ column }) => <TableSortableHeader column={column} title="Dipendente" />,
		cell: ({ row }) => {
			const employee = row.original.employee;
			if (!employee) {
				return (
					<div className="font-medium">
						#{row.original.employeeId.toString().padStart(4, "0")}
					</div>
				);
			}
			return (
				<div className="font-medium">
					{employee.surname} {employee.name}{" "}
					<span className="text-muted-foreground text-xs">
						#{employee.id.toString().padStart(4, "0")}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "type",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Tipo" />,
		cell: ({ row }) => {
			const type = row.getValue("type") as ContractType;
			return <div className="font-medium">{type}</div>;
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hourlyFee",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Costo orario" />,
		cell: ({ row }) => {
			const amount = row.getValue("hourlyFee") as string;
			return <div className="font-medium">{formatCurrencyEur(amount)}</div>;
		},
	},
	{
		accessorKey: "startingDate",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Inizio" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("startingDate"));
			return <div className="font-medium">{formatDateIt(date)}</div>;
		},
	},
	{
		accessorKey: "endingDate",
		meta: columnMeta("nativa"),
		header: ({ column }) => <TableSortableHeader column={column} title="Fine" />,
		cell: ({ row }) => {
			const label = formatContractEndingDateDisplay(
				row.original.type,
				row.original.endingDate
			);
			return <div className="font-medium">{label}</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Contratto"
				editFormContent={
					<>
						<FormField
							name="employeeId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Employee ID</FormLabel>
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
									<FormLabel>Contract Type</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a contract type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={ContractType.FixedTerm}>
												{ContractType.FixedTerm}
											</SelectItem>
											<SelectItem value={ContractType.OpenEnded}>
												{ContractType.OpenEnded}
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
									<FormLabel>Hourly Fee</FormLabel>
									<FormControl>
										<Input type="text" inputMode="decimal" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="startingDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Starting Date</FormLabel>
									<FormControl>
										<Input type="date" {...field} onChange={(e) => field.onChange(new Date(e.target.value))} disabled />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<ContractEndingDateField mode="input" />
					</>
				}
				editAction={async ({ values }) => {
					const updatedContract: ContractRow = {
						...row.original,
						...values,
						endingDate: isFixedTermContract(values.type)
							? (values.endingDate ?? null)
							: null,
					};
					await handleEdit(updatedContract);
				}}
				deleteAction={() =>
					handleDelete({ employeeId: row.original.employeeId, startingDate: row.original.startingDate })
				}
				editUnavailabe={row.original.employeeId === loggedEmployeeId}
				deleteUnavailabe={row.original.employeeId === loggedEmployeeId}
			/>
		),
	},
];
