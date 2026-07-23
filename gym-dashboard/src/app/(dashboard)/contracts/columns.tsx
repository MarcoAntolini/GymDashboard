"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { ContractTypeBadge, DomainBadge } from "@/components/ui/domain-badge";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractDTO } from "@/data-access/contracts";
import {
	contractEndingDisplay,
	normalizeContractEndingDate
} from "@/lib/contract-dates";
import {
	contractTypeLabel,
	formatCurrencyEur,
	formatDateIt,
	personLabel
} from "@/lib/format";
import { ContractType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, CalendarDays, CheckCircle2, Shapes, UserRound } from "lucide-react";
import { z } from "zod";
import { ContractEndingDateField } from "./contract-ending-date-field";

export const formSchema = z
	.object({
		employeeId: z.number(),
		type: z.nativeEnum(ContractType),
		hourlyFee: z.number(),
		startingDate: z.date(),
		endingDate: z.date().optional().nullable()
	})
	.superRefine((value, ctx) => {
		if (value.type === ContractType.FixedTerm && !value.endingDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "La data di fine è obbligatoria per i contratti a tempo determinato",
				path: ["endingDate"]
			});
		}
	});

function employeeLabel(contract: ContractDTO): string {
	return personLabel(contract.employee ?? { name: "", surname: "", id: contract.employeeId });
}

export const columns = (
	handleDelete: (contract: Pick<ContractDTO, "employeeId" | "startingDate">) => Promise<void>,
	handleEdit: (contract: ContractDTO) => Promise<void>,
	loggedEmployeeId: number
): ColumnDef<ContractDTO>[] => [
	{
		id: "employee",
		accessorFn: (row) => employeeLabel(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={UserRound} />
		),
		cell: ({ row }) => <div>{employeeLabel(row.original)}</div>
	},
	{
		id: "typeLabel",
		accessorFn: (row) => contractTypeLabel[row.type],
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Shapes} />
		),
		cell: ({ row }) => <ContractTypeBadge type={row.original.type} />
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Costo orario" icon={Banknote} />
		),
		cell: ({ row }) => {
			return (
				<div className="font-medium tabular-nums">{formatCurrencyEur(row.getValue("hourlyFee"))}</div>
			);
		}
	},
	{
		accessorKey: "startingDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Inizio" icon={CalendarDays} />
		),
		cell: ({ row }) => {
			return (
				<div className="font-medium">{formatDateIt(row.getValue("startingDate"))}</div>
			);
		}
	},
	{
		accessorKey: "endingDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Fine" icon={CalendarDays} />
		),
		cell: ({ row }) => {
			const display = contractEndingDisplay(
				row.original.type,
				row.original.endingDate,
				formatDateIt
			);
			if (display.kind === "ongoing") {
				return <DomainBadge label={display.label} tone="success" icon={CheckCircle2} />;
			}
			return <div className="font-medium">{display.label}</div>;
		}
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
									<FormLabel>Dipendente</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											onChange={(e) => field.onChange(parseInt(e.target.value))}
											disabled
										/>
									</FormControl>
									<p className="text-sm text-muted-foreground">{employeeLabel(row.original)}</p>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo contratto</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleziona un tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={ContractType.FixedTerm}>
												{contractTypeLabel[ContractType.FixedTerm]}
											</SelectItem>
											<SelectItem value={ContractType.OpenEnded}>
												{contractTypeLabel[ContractType.OpenEnded]}
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
									<FormLabel>Costo orario</FormLabel>
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
						<ContractEndingDateField>
							<FormField
								name="endingDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data fine</FormLabel>
										<FormControl>
											<Input
												type="date"
												{...field}
												value={
													field.value
														? new Date(field.value).toISOString().slice(0, 10)
														: ""
												}
												onChange={(e) =>
													field.onChange(e.target.value ? new Date(e.target.value) : undefined)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</ContractEndingDateField>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						...row.original,
						...values,
						endingDate: normalizeContractEndingDate(values.type, values.endingDate)
					});
				}}
				deleteAction={() =>
					handleDelete({ employeeId: row.original.employeeId, startingDate: row.original.startingDate })
				}
				editUnavailabe={row.original.employeeId === loggedEmployeeId}
				deleteUnavailabe={row.original.employeeId === loggedEmployeeId}
			/>
		)
	}
];
