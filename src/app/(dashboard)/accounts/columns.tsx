"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccountRow } from "@/data-access/accounts";
import { assignableRoles, canManageRole, isAppRole, type AppRole } from "@/data/nav-routes";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatPersonLabel, ROLE_LABEL } from "@/lib/domain/labels";
import { Account, Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const PASSWORD_MASK = "••••••••";

function MaskedPasswordCell({ password }: { password: string }) {
	const [revealed, setRevealed] = useState(false);

	return (
		<div className="flex items-center gap-1.5">
			<span className="font-mono text-sm tracking-wider tabular-nums">
				{revealed ? password : PASSWORD_MASK}
			</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-7 w-7 shrink-0 text-muted-foreground"
				aria-label={revealed ? "Nascondi password" : "Mostra password"}
				aria-pressed={revealed}
				onClick={() => setRevealed((open) => !open)}
			>
				{revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
			</Button>
		</div>
	);
}

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
): ColumnDef<AccountRow>[] => {
	const formSchema = roleFormSchema(actorRole);
	const rolesForSelect = assignableRoles(actorRole);

	return [
		{
			id: "employee",
			accessorFn: (row) =>
				row.employee ? formatPersonLabel(row.employee) : "",
			header: ({ column }) => <TableSortableHeader column={column} title="Dipendente" />,
			meta: columnMeta(ColumnClass.Join),
			cell: ({ row }) => (
				<div className="font-medium">
					{row.original.employee
						? formatPersonLabel(row.original.employee)
						: "—"}
				</div>
			),
		},
		{
			accessorKey: "username",
			header: ({ column }) => <TableSortableHeader column={column} title="Username" />,
			meta: columnMeta(ColumnClass.Native),
		},
		{
			accessorKey: "password",
			header: ({ column }) => <TableSortableHeader column={column} title="Password" />,
			meta: columnMeta(ColumnClass.Native),
			enableSorting: false,
			cell: ({ row }) => <MaskedPasswordCell password={row.original.password} />,
		},
		{
			accessorKey: "role",
			header: ({ column }) => <TableSortableHeader column={column} title="Ruolo" />,
			meta: columnMeta(ColumnClass.Native),
			enableSorting: false,
			cell: ({ row }) => <div>{ROLE_LABEL[row.original.role]}</div>,
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "approved",
			header: ({ column }) => <TableSortableHeader column={column} title="Approvazione" />,
			meta: columnMeta(ColumnClass.Native),
			enableSorting: false,
			cell: ({ row }) => (
				<div>{row.original.approved ? "Sì" : "No"}</div>
			),
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
						entityLabel="Account"
						editUnavailabe={!manageable || rolesForSelect.length === 0}
						deleteUnavailabe={!manageable}
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
											<FormLabel className="sr-only">Ruolo</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Seleziona un ruolo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{rolesForSelect.map((role) => (
														<SelectItem key={role} value={role}>
															{ROLE_LABEL[role]}
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
							await handleEdit({
								employeeId: row.original.employeeId,
								username: row.original.username,
								password: row.original.password,
								role: values.role as Role,
								approved: values.approved === "true",
							} satisfies Account);
						}}
						deleteAction={() => handleDelete({ employeeId: row.original.employeeId })}
					/>
				);
			},
		},
	];
};
