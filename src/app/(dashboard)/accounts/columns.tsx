"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DomainBadge, DotBadge } from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignableRoles, canManageRole, type AppRole } from "@/data/nav-routes";
import { maskSecret } from "@/lib/domain/password-mask";
import {
	ROLE_LABELS,
	approvalStatusVisual,
	roleChip,
} from "@/lib/format/domain-visuals";
import { Account, Role } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, Eye, EyeOff, Hash, KeyRound, Tag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

function roleFormSchema(actorRole: AppRole) {
	const allowed = assignableRoles(actorRole) as [AppRole, ...AppRole[]];
	return z.object({
		role: z.enum(allowed),
		approved: z.string().optional(),
	});
}

/** Per-row password mask with explicit reveal; plaintext stays out of the DOM until revealed. */
function PasswordCell({ password }: { password: string }) {
	const [revealed, setRevealed] = useState(false);

	return (
		<div className="flex min-w-0 items-center gap-1">
			<span
				className="truncate font-mono text-sm tracking-wider"
				aria-label={revealed ? "Password visibile" : "Password nascosta"}
			>
				{revealed ? password : maskSecret(password)}
			</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-8 w-8 shrink-0"
				onClick={() => setRevealed((v) => !v)}
				aria-label={revealed ? "Nascondi password" : "Mostra password"}
				aria-pressed={revealed}
			>
				{revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</Button>
		</div>
	);
}

export const columns = (
	handleDelete: (account: Pick<Account, "employeeId">) => Promise<void>,
	handleEdit: (account: Account) => Promise<void>,
	actorRole: AppRole
): ColumnDef<Account>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={Hash} />
		),
		cell: ({ row }) => {
			return <div>{row.original.employeeId.toString().padStart(4, "0")}</div>;
		},
	},
	{
		accessorKey: "username",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Username" icon={UserRound} />
		),
	},
	{
		accessorKey: "password",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Password" icon={KeyRound} />
		),
		enableSorting: false,
		enableColumnFilter: false,
		cell: ({ row }) => <PasswordCell password={row.original.password} />,
	},
	{
		accessorKey: "role",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Ruolo" icon={Tag} />
		),
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		cell: ({ row }) => {
			const chip = roleChip(row.original.role);
			return <DotBadge label={chip.label} tone={chip.tone} />;
		},
	},
	{
		accessorKey: "approved",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Approvazione" icon={BadgeCheck} />
		),
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		cell: ({ row }) => {
			const visual = approvalStatusVisual(row.original.approved);
			return (
				<DomainBadge
					label={visual.label}
					tone={visual.tone}
					icon={visual.icon}
				/>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const targetRole = row.original.role as AppRole;
			const canManage = canManageRole(actorRole, targetRole);
			const allowedRoles = assignableRoles(actorRole);
			const formSchema = roleFormSchema(actorRole);

			return (
				<ItemActions
					row={row}
					formSchema={formSchema}
					entityLabel="Account"
					editUnavailabe={!canManage}
					deleteUnavailabe={!canManage}
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
										<FormLabel>Ruolo</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleziona ruolo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{allowedRoles.includes("Admin") ? (
													<SelectItem value={Role.Admin}>
														{ROLE_LABELS[Role.Admin]}
													</SelectItem>
												) : null}
												{allowedRoles.includes("Employee") ? (
													<SelectItem value={Role.Employee}>
														{ROLE_LABELS[Role.Employee]}
													</SelectItem>
												) : null}
											</SelectContent>
										</Select>
										{field.value ? (
											<div className="pt-1">
												<DotBadge {...roleChip(field.value as Role)} />
											</div>
										) : null}
									</FormItem>
								)}
							/>
							<FormField
								name="approved"
								render={({ field }) => {
									useEffect(() => {
										field.onChange(row.original.approved ? "true" : "false");
									}, []);
									const visual = approvalStatusVisual(field.value === "true");
									return (
										<FormItem className="flex flex-row items-start justify-between gap-3 rounded-md border p-3">
											<div className="flex flex-col gap-2">
												<FormLabel>Approvazione</FormLabel>
												<DomainBadge
													label={visual.label}
													tone={visual.tone}
													icon={visual.icon}
												/>
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
						const updatedAccount: Account = {
							...row.original,
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
