"use client";

import { ApprovalQueueSheet } from "@/app/(dashboard)/accounts/approval-queue-sheet";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
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
	getAllAccounts,
	getPendingAccounts,
	rejectAccount,
} from "@/data-access/accounts";
import { getEmployeesWithoutAccount } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
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

export default function Accounts() {
	const [actorRole, setActorRole] = useState<AppRole | null>(null);
	const [isApprovalSheetOpen, setIsApprovalSheetOpen] = useState(false);
	const [pendingAccounts, setPendingAccounts] = useState<Account[]>([]);
	const [pendingLoading, setPendingLoading] = useState(false);

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

	const {
		data: accounts,
		setData: setAccounts,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Account, "employeeId">(
		useMemo(
			() => ({
				getAll: getAllAccounts,
				deleteAction: deleteAccount,
				editAction: async (entity: Account) => {
					await editAccount({
						employeeId: entity.employeeId,
						role: entity.role,
						approved: entity.approved,
					});
					return entity;
				},
			}),
			[]
		),
		["employeeId"]
	);
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
	const handleCreateAccount = useCallback(
		async (values: z.infer<typeof createAccountSchema>) => {
			setIsPending(true);
			const newAccount = await createAccount({ ...values, username: newUsername });
			setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
			setIsPending(false);
			setNewUsername("");
			setEmployeesWithoutAccount((prevEmployees) =>
				prevEmployees.filter((employee) => employee.id !== values.employeeId)
			);
		},
		[setAccounts, setEmployeesWithoutAccount, newUsername]
	);
	function generateUsername(employee?: Employee) {
		if (!employee || !employee.name || !employee.surname) {
			return "";
		}
		const username = `${employee.name.slice(0, 5)}.${employee.surname.slice(0, 5)}`;
		let number = 1;
		while (accounts.some((account) => account.username === username + number)) {
			number++;
		}
		setNewUsername(username + number);
	}

	const refreshPending = useCallback(async () => {
		setPendingLoading(true);
		try {
			const pending = await getPendingAccounts();
			setPendingAccounts(pending);
		} finally {
			setPendingLoading(false);
		}
	}, []);

	const openApprovalQueue = useCallback(async () => {
		setIsApprovalSheetOpen(true);
		await refreshPending();
	}, [refreshPending]);

	const handleApprovePending = useCallback(
		async (employeeId: number) => {
			const updated = await approveAccount({ employeeId });
			setPendingAccounts((prev) => prev.filter((a) => a.employeeId !== employeeId));
			setAccounts((prev) => {
				const exists = prev.some((a) => a.employeeId === employeeId);
				if (exists) {
					return prev.map((a) => (a.employeeId === employeeId ? updated : a));
				}
				return [...prev, updated];
			});
		},
		[setAccounts]
	);

	const handleRejectPending = useCallback(
		async (employeeId: number) => {
			await rejectAccount({ employeeId });
			setPendingAccounts((prev) => prev.filter((a) => a.employeeId !== employeeId));
			setAccounts((prev) => prev.filter((a) => a.employeeId !== employeeId));
			const employees = await getEmployeesWithoutAccount();
			setEmployeesWithoutAccount(employees);
		},
		[setAccounts, setEmployeesWithoutAccount]
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
												generateUsername(
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
								render={({ field }) => (
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

	const pendingCount = accounts.filter((a) => !a.approved).length;

	return isLoading || !actorRole ? (
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
					<DataTable
						columns={columns(handleDelete, handleEdit, actorRole)}
						data={accounts}
						filters={["username"]}
						facetedFilters={["role", "approved"]}
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
