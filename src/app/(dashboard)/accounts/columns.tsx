"use client";

import { Button } from "@/components/ui/button";
import {
	DomainBadge,
	DotBadge,
} from "@/components/ui/domain-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePerson } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OverflowText } from "@/components/ui/overflow-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccountRow } from "@/data-access/accounts";
import { assignableRoles, canManageRole, type AppRole } from "@/data/nav-routes";
import {
	approvalBadgeSamples,
	roleBadgeSamples,
} from "@/components/ui/data-table/table-width-samples";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import { formatPersonLabel, ROLE_LABEL } from "@/lib/domain/labels";
import { toAppRole } from "@/lib/domain/roles";
import { ROLE_ICON, ROLE_TONE } from "@/lib/domain/visual";
import { Account, Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import {
	Eye,
	EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const PASSWORD_MASK = "••••••••";

function MaskedPasswordCell({ password }: { password: string }) {
	const [revealed, setRevealed] = useState(false);

	return (
		<div className="flex min-w-0 w-full items-center gap-1.5">
			<div className="min-w-0 flex-1">
				<OverflowText className="font-mono text-sm tracking-wider tabular-nums">
					{revealed ? password : PASSWORD_MASK}
				</OverflowText>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-6 shrink-0 p-0 text-muted-foreground"
				aria-label={revealed ? "Nascondi password" : "Mostra password"}
				aria-pressed={revealed}
				onClick={(event) => {
					event.stopPropagation();
					setRevealed((open) => !open);
				}}
			>
				{revealed ? (
					<EyeOff className="size-3.5" />
				) : (
					<Eye className="size-3.5" />
				)}
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
	actorRole: AppRole,
	handleApprove?: (account: Pick<Account, "employeeId">) => Promise<void>
): ColumnDef<AccountRow>[] => {
	const formSchema = roleFormSchema(actorRole);
	const rolesForSelect = assignableRoles(actorRole);

	return [
		{
			id: "employee",
			accessorFn: (row) =>
				row.employee ? formatPersonLabel(row.employee) : "",
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Dipendente" icon={ENTITY_ICON.employee} />
			),
			meta: columnMeta(ColumnClass.Join, { width: ColumnWidth.Text }),
			cell: ({ row }) => (
				<TablePerson
					person={
						row.original.employee
							? { ...row.original.employee, id: row.original.employeeId }
							: null
					}
					nameFilterKeys="employee"
				/>
			),
		},
		{
			accessorKey: "username",
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Nome utente" icon={ATTR_ICON.username} />
			),
			meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
		},
		{
			accessorKey: "password",
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Password" icon={ATTR_ICON.password} />
			),
			meta: columnMeta(ColumnClass.Native, {
				noCellOverflow: true,
				width: ColumnWidth.Text,
			}),
			enableSorting: false,
			cell: ({ row }) => <MaskedPasswordCell password={row.original.password} />,
		},
		{
			accessorKey: "role",
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Ruolo" icon={ATTR_ICON.role} />
			),
			meta: columnMeta(ColumnClass.Native, {
				width: ColumnWidth.Content,
				widthSamples: roleBadgeSamples(),
			}),
			enableSorting: false,
			cell: ({ row }) => {
				const appRole = toAppRole(row.original.role);
				if (!appRole) return <span className="text-muted-foreground">—</span>;
				return (
					<DotBadge
						label={ROLE_LABEL[appRole]}
						icon={ROLE_ICON[appRole]}
						tone={ROLE_TONE[appRole]}
					/>
				);
			},
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "approved",
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Approvazione" icon={ATTR_ICON.approved} />
			),
			meta: columnMeta(ColumnClass.Native, {
				width: ColumnWidth.Content,
				widthSamples: approvalBadgeSamples(),
			}),
			enableSorting: false,
			cell: ({ row }) =>
				row.original.approved ? (
					<DomainBadge label="Approvato" tone="success" icon={ATTR_ICON.approved} />
				) : (
					<DomainBadge label="In attesa" tone="warning" icon={ATTR_ICON.pending} />
				),
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const targetRole = toAppRole(row.original.role);
				const manageable = targetRole != null && canManageRole(actorRole, targetRole);

				return (
					<ItemActions
						row={row}
						formSchema={formSchema}
						entityLabel="Account"
						editUnavailabe={!manageable || rolesForSelect.length === 0}
						deleteUnavailabe={!manageable}
						extraMenuItems={
							!row.original.approved && manageable && handleApprove
								? [
										{
											id: "approve",
											label: "Approva",
											onSelect: () => {
												void (async () => {
													try {
														await handleApprove({
															employeeId: row.original.employeeId,
														});
														toast.success("Account approvato");
													} catch (error) {
														toast.error(
															error instanceof Error && error.message
																? error.message
																: "Impossibile approvare l'account."
														);
													}
												})();
											},
										},
									]
								: undefined
						}
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
											<FormLabel>Ruolo</FormLabel>
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
												<div className="space-y-1">
													<FormLabel>Approvato</FormLabel>
													{field.value === "true" ? (
														<DomainBadge label="Approvato" tone="success" icon={ATTR_ICON.approved} />
													) : (
														<DomainBadge label="In attesa" tone="warning" icon={ATTR_ICON.pending} />
													)}
												</div>
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
