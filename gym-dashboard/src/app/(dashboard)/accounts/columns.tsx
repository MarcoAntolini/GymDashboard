"use client";

import { Checkbox } from "@/components/ui/checkbox";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account, Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
	role: z.enum([Role.Admin, Role.Employee]),
	approved: z.string().optional(),
});

export const columns = (
	handleDelete: (account: Pick<Account, "employeeId">) => Promise<void>,
	handleEdit: (account: Account) => Promise<void>
): ColumnDef<Account>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="EmployeeID"
			/>
		),
	},
	{
		accessorKey: "username",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Username"
			/>
		),
	},
	{
		accessorKey: "password",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Password"
			/>
		),
		enableSorting: false,
	},
	{
		accessorKey: "role",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Role"
			/>
		),
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "approved",
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Approved"
			/>
		),
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
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
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="sr-only">Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={Role.Admin}>Admin</SelectItem>
											<SelectItem value={Role.Employee}>Employee</SelectItem>
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>
						<FormField
							name="approved"
							render={({ field }) => {
								useEffect(() => {
									field.onChange(row.original.approved ? "true" : "false");
								}, []);
								return (
									<FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0 rounded-md border p-3">
										<FormLabel>Approved</FormLabel>
										<FormControl>
											<Checkbox
												checked={field.value === "true"}
												onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
											/>
										</FormControl>
									</FormItem>
								);
							}}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const updatedAccount = {
						...row.original,
						...values,
						approved: values.approved === "true",
					};
					await handleEdit(updatedAccount);
				}}
				deleteAction={() => handleDelete({ employeeId: row.original.employeeId! })}
			/>
		),
	},
];
