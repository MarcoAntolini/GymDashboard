"use client";

import { Checkbox } from "@/components/ui/checkbox";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { ApprovalBadge, RoleBadge } from "@/components/ui/domain-badge";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountListItem } from "@/data-access/accounts";
import { Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, BriefcaseBusiness, Hash, UserRound } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
	role: z.enum([Role.Admin, Role.Employee]),
	approved: z.string().optional(),
});

export const columns = (
	handleDelete: (account: Pick<AccountListItem, "employeeId">) => Promise<void>,
	handleEdit: (account: AccountListItem) => Promise<void>
): ColumnDef<AccountListItem>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={Hash} />
		),
		cell: ({ row }) => {
			return (
				<div className="tabular-nums">{row.original.employeeId.toString().padStart(4, "0")}</div>
			);
		},
	},
	{
		accessorKey: "username",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Nome utente" icon={UserRound} />
		),
	},
	{
		id: "roleLabel",
		accessorFn: (row) => (row.role === Role.Admin ? "Amministratore" : "Dipendente"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Ruolo" icon={BriefcaseBusiness} />
		),
		cell: ({ row }) => <RoleBadge role={row.original.role} />,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		id: "approvedLabel",
		accessorFn: (row) => (row.approved ? "Approvato" : "In attesa"),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Approvazione" icon={BadgeCheck} />
		),
		cell: ({ row }) => <ApprovalBadge approved={row.original.approved} />,
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
				entityLabel="Account"
				editFormContent={
					<>
						<div className="grid grid-cols-3 gap-4">
							<FormField
								name="employeeId"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel className="text-muted-foreground">ID Dipendente</FormLabel>
										<Input disabled onChange={field.onChange} defaultValue={field.value} />
									</FormItem>
								)}
							/>
							<FormField
								name="username"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel className="text-muted-foreground">Nome utente</FormLabel>
										<Input disabled onChange={field.onChange} defaultValue={field.value} />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="sr-only">Ruolo</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Seleziona un ruolo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={Role.Admin}>Amministratore</SelectItem>
											<SelectItem value={Role.Employee}>Dipendente</SelectItem>
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
										<FormLabel>Approvato</FormLabel>
										<FormControl>
											<Checkbox
												checked={field.value === "true"}
												onCheckedChange={(checked) =>
													field.onChange(checked ? "true" : "false")
												}
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
