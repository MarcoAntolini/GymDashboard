"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	approveAccount,
	createAccount,
	deleteAccount,
	editAccount,
	getAccount,
	listAccounts,
	type AccountRow,
} from "@/data-access/accounts";
import { getEmployeesWithoutAccount } from "@/data-access/employees";
import { canManageRole, isAppRole, type AppRole } from "@/data/nav-routes";
import { useEntityData } from "@/hooks/useEntityData";
import { useServerList } from "@/hooks/useServerList";
import {
	ACCOUNT_DEFAULT_SORT,
	ACCOUNT_FACETED_FILTERS,
	ACCOUNT_FILTER_ALLOWLIST,
	ACCOUNT_SORT_ALLOWLIST,
	ACCOUNT_FILTER_LABELS,
} from "@/lib/list/accounts";
import { Account, Employee } from "@prisma/client";
import { BadgeCheck, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ApprovalQueueToolbarButton } from "./approval-queue-sheet";
import { columns } from "./columns";
import type { DataTableBulkAction } from "@/components/ui/data-table";

const createAccountSchema = z.object({
	employeeId: z.number().int().positive(),
	username: z.string().optional(),
	password: z.string(),
});

export default function Accounts() {
	const list = useServerList<AccountRow>({
		list: listAccounts,
		sortAllowlist: ACCOUNT_SORT_ALLOWLIST,
		filterAllowlist: ACCOUNT_FILTER_ALLOWLIST,
		defaultSort: [...ACCOUNT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const { data: employeesWithoutAccount, setData: setEmployeesWithoutAccount } = useEntityData<Employee, "id">(
		useMemo(
			() => ({
				getAll: getEmployeesWithoutAccount,
			}),
			[]
		),
		["id"]
	);

	const [newUsername, setNewUsername] = useState<string>("");
	const [isPending, setIsPending] = useState(false);
	const [actorRole, setActorRole] = useState<AppRole | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (isAppRole(me?.role)) setActorRole(me.role);
			} catch {
				/* nav/layout already redirects unauthenticated */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleDelete = useCallback(
		async (account: Pick<Account, "employeeId">) => {
			await deleteAccount(account);
			refetch();
		},
		[refetch]
	);

	const handleApprove = useCallback(
		async (account: Pick<Account, "employeeId">) => {
			await approveAccount({ employeeId: account.employeeId });
			setItems((prev) =>
				prev.map((item) =>
					item.employeeId === account.employeeId
						? { ...item, approved: true }
						: item
				)
			);
		},
		[setItems]
	);

	const bulkApproveActions = useMemo<DataTableBulkAction<AccountRow>[]>(() => {
		if (!actorRole) return [];
		return [
			{
				id: "approve",
				label: "Approva",
				icon: BadgeCheck,
				variant: "success",
				isAvailable: (rows) =>
					rows.some((row) => {
						if (row.approved) return false;
						const targetRole = isAppRole(row.role) ? row.role : null;
						return targetRole != null && canManageRole(actorRole, targetRole);
					}),
				filterRows: (rows) =>
					rows.filter((row) => {
						if (row.approved) return false;
						const targetRole = isAppRole(row.role) ? row.role : null;
						return targetRole != null && canManageRole(actorRole, targetRole);
					}),
				run: async (row) => {
					await approveAccount({ employeeId: row.employeeId });
				},
				confirmTitle: (count) => `Approvare ${count} account?`,
				confirmDescription:
					"Solo gli account in attesa gestibili dal tuo ruolo verranno approvati.",
			},
		];
	}, [actorRole]);

	const handleEdit = useCallback(
		async (account: Account) => {
			const updated = await editAccount({
				employeeId: account.employeeId,
				role: account.role,
				approved: account.approved,
			});
			setItems((prev) =>
				prev.map((item) =>
					item.employeeId === updated.employeeId ? updated : item
				)
			);
		},
		[setItems]
	);

	const handleCreateAccount = useCallback(
		async (values: z.infer<typeof createAccountSchema>) => {
			setIsPending(true);
			await createAccount({ ...values, username: newUsername });
			setIsPending(false);
			setNewUsername("");
			setEmployeesWithoutAccount((prevEmployees) =>
				prevEmployees.filter((employee) => employee.id !== values.employeeId)
			);
			refetch();
		},
		[newUsername, refetch, setEmployeesWithoutAccount]
	);

	const generateUsername = useCallback(async (employee?: Employee) => {
		if (!employee || !employee.name || !employee.surname) {
			setNewUsername("");
			return;
		}
		const base = `${employee.name.slice(0, 5)}.${employee.surname.slice(0, 5)}`;
		let number = 1;
		while (await getAccount({ username: base + number })) {
			number++;
		}
		setNewUsername(base + number);
	}, []);

	const createAccountFormData: FormData<typeof createAccountSchema> = {
		formSchema: createAccountSchema,
		defaultValues: {
			employeeId: 0,
			username: "",
			password: "",
		},
		submitAction: handleCreateAccount,
	};

	const actions: Action[] = [
		{
			title: "Aggiungi account",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutAccount.length === 0 ? (
						<div className="text-center text-gray-500 py-4">Tutti i dipendenti hanno già un account</div>
					) : (
						<>
							<FormField
								name="employeeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dipendente</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(parseInt(value, 10));
												void generateUsername(
													employeesWithoutAccount.find((employee) => employee.id === parseInt(value, 10))
												);
											}}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona un dipendente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													{employeesWithoutAccount.map((employee) => (
														<SelectItem
															key={employee.id}
															value={employee.id.toString()}
														>
															{employee.id} - {employee.name} {employee.surname}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="username"
								render={() => (
									<FormItem>
										<FormLabel>Nome utente</FormLabel>
										<Input
											value={newUsername}
											disabled
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<Input
											{...field}
											type="password"
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}
				</>
			),
			onDialogClose: () => {
				if (!isPending) {
					setNewUsername("");
				}
			},
			formData: createAccountFormData,
		},
	];

	const handleQueueApproved = useCallback(
		(employeeId: number) => {
			setItems((prev) =>
				prev.map((account) =>
					account.employeeId === employeeId ? { ...account, approved: true } : account
				)
			);
		},
		[setItems]
	);

	const handleQueueRejected = useCallback(
		(employeeId: number) => {
			setItems((prev) => prev.filter((account) => account.employeeId !== employeeId));
			void getEmployeesWithoutAccount().then(setEmployeesWithoutAccount);
		},
		[setItems, setEmployeesWithoutAccount]
	);

	return !actorRole ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			extraToolbar={
				<ApprovalQueueToolbarButton
					actorRole={actorRole}
					onAccountApproved={handleQueueApproved}
					onAccountRejected={handleQueueRejected}
				/>
			}
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit, actorRole, handleApprove)}
					getRowId={(row) => String(row.employeeId)}
					entityLabel="Account"
					bulkDeleteRow={async (row) => {
						await deleteAccount({ employeeId: row.employeeId });
					}}
					bulkActions={bulkApproveActions}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={[...ACCOUNT_FILTER_ALLOWLIST]}
					facetedFilters={ACCOUNT_FACETED_FILTERS}
					filterLabels={ACCOUNT_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun account"
							hint="Usa Aggiungi account per creare il primo Account."
						/>
					}
					serverList={{
						manual: true,
						pageCount: list.pageCount,
						rowCount: list.total,
						sorting: list.sorting,
						onSortingChange: list.onSortingChange,
						pagination: list.pagination,
						onPaginationChange: list.onPaginationChange,
						draftFilters: list.draftFilters,
						onDraftFilterChange: list.setDraftFilter,
						onApplyFilters: list.applyFilters,
						onResetFilters: list.resetFilters,
						filtersDirty: list.filtersDirty,
						appliedFilters: list.query.filters,
					}}
				/>
			}
		/>
	);
}
