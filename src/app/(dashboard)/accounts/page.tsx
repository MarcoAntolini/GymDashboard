"use client";

import { ApprovalQueueSheet } from "@/app/(dashboard)/accounts/approval-queue-sheet";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAppRole, type AppRole } from "@/data/nav-routes";
import {
	approveAccount,
	createAccount,
	deleteAccount,
	editAccount,
	getAccount,
	getPendingAccounts,
	listAccounts,
	rejectAccount,
	type AccountListResult,
} from "@/data-access/accounts";
import { getEmployeesWithoutAccount } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	ACCOUNT_LIST_DEFAULT_SORT,
	ACCOUNT_LIST_FILTER_IDS,
	ACCOUNT_LIST_SORT_COLUMNS,
} from "@/lib/domain/account-list-query";
import { Account, Employee } from "@prisma/client";
import { ClipboardCheck, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { columns } from "./columns";

const createAccountSchema = z.object({
	employeeId: z.number().int().positive(),
	username: z.string().optional(),
	password: z.string(),
});

const ACCOUNT_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "username", label: "Username", placeholder: "Username" },
	{ id: "role", label: "Ruolo", placeholder: "Ruolo (Admin/Employee/…)" },
	{ id: "approved", label: "Approvato", placeholder: "Approvato (true/false)" },
	{ id: "employeeId", label: "ID dipendente", placeholder: "ID dipendente" },
];

const EMPTY_FILTERS = Object.fromEntries(
	ACCOUNT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof ACCOUNT_LIST_FILTER_IDS)[number], string>;

export default function Accounts() {
	const [actorRole, setActorRole] = useState<AppRole | null>(null);
	const [isApprovalSheetOpen, setIsApprovalSheetOpen] = useState(false);
	const [pendingAccounts, setPendingAccounts] = useState<Account[]>([]);
	const [pendingLoading, setPendingLoading] = useState(false);
	const [newUsername, setNewUsername] = useState<string>("");
	const [isPending, setIsPending] = useState(false);
	const [result, setResult] = useState<AccountListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const listQuery = useServerListQuery({
		allowedSortColumns: ACCOUNT_LIST_SORT_COLUMNS,
		defaultSort: ACCOUNT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await fetch("/api/auth/me");
			if (!res.ok) return;
			const me = await res.json();
			if (!cancelled && me?.role && isAppRole(me.role)) {
				setActorRole(me.role);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listAccounts(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const refreshPending = useCallback(async () => {
		setPendingLoading(true);
		try {
			const pending = await getPendingAccounts();
			setPendingAccounts(pending);
		} finally {
			setPendingLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshPending();
	}, [refreshPending]);

	const { data: employeesWithoutAccount, setData: setEmployeesWithoutAccount } = useEntityData<Employee, "id">(
		useMemo(
			() => ({
				getAll: getEmployeesWithoutAccount,
			}),
			[]
		),
		["id"]
	);

	const handleDelete = useCallback(
		async (account: Pick<Account, "employeeId">) => {
			await deleteAccount(account);
			await fetchList();
			await refreshPending();
		},
		[fetchList, refreshPending]
	);

	const handleEdit = useCallback(
		async (account: Account) => {
			await editAccount({
				employeeId: account.employeeId,
				role: account.role,
				approved: account.approved,
			});
			await fetchList();
			await refreshPending();
		},
		[fetchList, refreshPending]
	);

	const handleCreateAccount = useCallback(
		async (values: z.infer<typeof createAccountSchema>) => {
			setIsPending(true);
			try {
				await createAccount({ ...values, username: newUsername });
				setNewUsername("");
				setEmployeesWithoutAccount((prevEmployees) =>
					prevEmployees.filter((employee) => employee.id !== values.employeeId)
				);
				await fetchList();
			} finally {
				setIsPending(false);
			}
		},
		[fetchList, setEmployeesWithoutAccount, newUsername]
	);

	async function generateUsername(employee?: Employee) {
		if (!employee || !employee.name || !employee.surname) {
			setNewUsername("");
			return;
		}
		const base = `${employee.name.slice(0, 5)}.${employee.surname.slice(0, 5)}`;
		let number = 1;
		let candidate = base + number;
		// Uniqueness against full DB (not only the current page).
		while (await getAccount({ username: candidate })) {
			number += 1;
			candidate = base + number;
		}
		setNewUsername(candidate);
	}

	const openApprovalQueue = useCallback(async () => {
		setIsApprovalSheetOpen(true);
		await refreshPending();
	}, [refreshPending]);

	const handleApprovePending = useCallback(
		async (employeeId: number) => {
			await approveAccount({ employeeId });
			setPendingAccounts((prev) => prev.filter((a) => a.employeeId !== employeeId));
			await fetchList();
		},
		[fetchList]
	);

	const handleRejectPending = useCallback(
		async (employeeId: number) => {
			await rejectAccount({ employeeId });
			setPendingAccounts((prev) => prev.filter((a) => a.employeeId !== employeeId));
			const employees = await getEmployeesWithoutAccount();
			setEmployeesWithoutAccount(employees);
			await fetchList();
		},
		[fetchList, setEmployeesWithoutAccount]
	);

	const tableColumns = useMemo(
		() => (actorRole ? columns(handleDelete, handleEdit, actorRole) : []),
		[actorRole, handleDelete, handleEdit]
	);

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
			title: "Add Account",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutAccount.length === 0 ? (
						<div className="text-center text-gray-500 py-4">All the employees already have an account</div>
					) : (
						<>
							<FormField
								name="employeeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employee</FormLabel>
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
													<SelectValue placeholder="Select an employee" />
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
										<FormLabel>Username</FormLabel>
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

	const pendingCount = pendingAccounts.length;
	const showPlaceholder = (isLoading && result === null) || !actorRole;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<>
			<Dashboard
				actions={actions}
				toolbarExtra={
					<Button
						type="button"
						variant="ghost"
						onClick={openApprovalQueue}
						disabled={pendingLoading}
					>
						<ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
						Approvazione
						{pendingCount > 0 ? (
							<span className="ml-2 text-xs text-muted-foreground">({pendingCount})</span>
						) : null}
					</Button>
				}
				table={
					<ServerDataTable
						columns={tableColumns}
						data={result?.rows ?? []}
						total={result?.total ?? 0}
						page={listQuery.page}
						pageSize={listQuery.pageSize}
						pageCount={result?.pageCount ?? 0}
						sort={listQuery.sort}
						onSortChange={listQuery.setSort}
						onPageChange={listQuery.setPage}
						onPageSizeChange={listQuery.setPageSize}
						filterFields={ACCOUNT_FILTER_FIELDS}
						draftFilters={listQuery.draftFilters}
						onDraftFilterChange={listQuery.setDraftFilter}
						onApplyFilters={listQuery.applyFilters}
						onResetFilters={listQuery.resetFilters}
						isFilterDirty={listQuery.isFilterDirty}
						hasAppliedFilters={listQuery.hasAppliedFilters}
						emptyKind={result?.emptyKind ?? null}
						datasetEmptyMessage="Nessun Account registrato."
					/>
				}
			/>
			<ApprovalQueueSheet
				open={isApprovalSheetOpen}
				onOpenChange={setIsApprovalSheetOpen}
				actorRole={actorRole}
				pendingAccounts={pendingAccounts}
				onApprove={handleApprovePending}
				onReject={handleRejectPending}
			/>
		</>
	);
}
