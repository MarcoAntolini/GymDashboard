"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contract, ContractType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
	employeeId: z.number().int().positive("Must select an employee"),
	type: z.nativeEnum(ContractType),
	hourlyFee: z.number().positive(),
	startingDate: z.date(),
	endingDate: z.date().optional(),
});

export const columns = (
	handleDelete: (contract: Pick<Contract, "employeeId" | "startingDate">) => Promise<void>,
	handleEdit: (contract: Contract) => Promise<void>
): ColumnDef<Contract>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Employee ID"
			/>
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Contract Type"
			/>
		),
		cell: ({ row }) => {
			const type = row.getValue("type");
			return <div className="font-medium">{type === ContractType.FixedTerm ? "Fixed Term" : "Open Ended"}</div>;
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Hourly Fee"
			/>
		),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("hourlyFee"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			})
				.format(amount)
				.replace("$", "$ ");
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "startingDate",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Starting Date"
			/>
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("startingDate"));
			return <div className="font-medium">{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "endingDate",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Ending Date"
			/>
		),
		cell: ({ row }) => {
			const date = row.getValue("endingDate");
			return date ? <div className="font-medium">{new Date(date as Date).toLocaleDateString()}</div> : <div>-</div>;
		},
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
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a contract type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={ContractType.FixedTerm}>Fixed Term</SelectItem>
											<SelectItem value={ContractType.OpenEnded}>Open Ended</SelectItem>
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
									<FormLabel>Starting Date</FormLabel>
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
						<FormField
							name="endingDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ending Date</FormLabel>
									<FormControl>
										<Input
											type="date"
											{...field}
											onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedContract = {
						...row.original,
						...values,
					};
					await handleEdit(updatedContract);
				}}
				deleteAction={() =>
					handleDelete({ employeeId: row.original.employeeId, startingDate: row.original.startingDate })
				}
			/>
		),
	},
];
