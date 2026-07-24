"use client";

import { Checkbox } from "@/components/ui/checkbox";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignableRoles, canManageRole, isAppRole, type AppRole } from "@/data/nav-routes";
import { Account, Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect } from "react";
import { z } from "zod";

function roleFormSchema(actorRole: AppRole) {
	const roles = assignableRoles(actorRole);
	if (roles.length === 0) {
		return z.object({
			role: z.enum(["Employee"]),
			approved: z.string().optional(),
		});
	}
	if (roles.length === 1) {
		return z.object({
			role: z.literal(roles[0]),
			approved: z.string().optional(),
		});
	}
	return z.object({
		role: z.enum(roles as [AppRole, AppRole, ...AppRole[]]),
		approved: z.string().optional(),
	});
}

export const columns = (
	handleDelete: (account: Pick<Account, "employeeId">) => Promise<void>,
	handleEdit: (account: Account) => Promise<void>,
	actorRole: AppRole
): ColumnDef<Account>[] => {
	const formSchema = roleFormSchema(actorRole);
	const rolesForSelect = assignableRoles(actorRole);

	return [
		{
			accessorKey: "employeeId",
			header: ({ column }) => <TableSortableHeader column={column} title="EmployeeID" />,
			cell: ({ row }) => {
				return <div>{row.original.employeeId.toString().padStart(4, "0")}</div>;
			},
		},
		{
			accessorKey: "username",

			header: ({ column }) => <TableSortableHeader column={column} title="Username" />,
		},
		{
			accessorKey: "password",
			header: ({ column }) => <TableSortableHeader column={column} title="Password" />,
			enableSorting: false,
		},
		{
			accessorKey: "role",
			header: ({ column }) => <TableSortableHeader column={column} title="Role" />,
			enableSorting: false,
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "approved",
			header: ({ column }) => <TableSortableHeader column={column} title="Approved" />,
			enableSorting: false,
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const targetRole = isAppRole(row.original.role) ? row.original.role : null;
				const manageable = targetRole != null && canManageRole(actorRole, targetRole);

				return (
					<ItemActions
						row={row}
						formSchema={formSchema}
						editUnavailabe={!manageable || rolesForSelect.length === 0}
						deleteUnavailabe={!manageable}
						editFormContent={
							<>
								<div className="grid grid-cols-3 gap-4">
									<FormField
										name="employeeId"
										render={({ field }) => (
											<FormItem className="col-span-1">
												<FormLabel className="text-muted-foreground">Employee ID</FormLabel>
												<Input disabled onChange={field.onChange} defaultValue={field.value} />
											</FormItem>
										)}
									/>
									<FormField
										name="username"
										render={({ field }) => (
											<FormItem className="col-span-2">
												<FormLabel className="text-muted-foreground">Username</FormLabel>
												<Input disabled onChange={field.onChange} defaultValue={field.value} />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="sr-only">Role</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select a role" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{rolesForSelect.map((role) => (
														<SelectItem key={role} value={role}>
															{role === "Admin" ? "Admin" : "Employee"}
														</SelectItem>
													))}
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
								role: values.role as Role,
								approved: values.approved === "true",
							};
							await handleEdit(updatedAccount);
						}}
						deleteAction={() => handleDelete({ employeeId: row.original.employeeId! })}
					/>
				);
			},
		},
	];
};
