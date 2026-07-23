"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	AccountListItem,
	createAccount,
	deleteAccount,
	editAccount,
	listAccounts,
	listPendingAccounts
} from "@/data-access/accounts";
import { getEmployeesWithoutAccount } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { useEntityList } from "@/hooks/useEntityList";
import { Employee } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { columns } from "./columns";
import { PendingApprovals } from "./pending-approvals";

const createAccountSchema = z.object({
	employeeId: z.number().int().positive(),
	username: z.string().optional(),
	password: z.string(),
});

export default function Accounts() {
	const {
		data: accounts,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete,
		handleEdit,
	} = useEntityList<AccountListItem, "employeeId">(
		useMemo(
			() => ({
				list: listAccounts,
				deleteAction: deleteAccount,
				editAction: editAccount,
			}),
			[]
		),
		["employeeId"]
	);
	const { data: employeesWithoutAccount, setData: setEmployeesWithoutAccount } = useEntityData<
		Employee,
		"id"
	>(
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
			try {
				await createAccount({ ...values, username: newUsername });
				setNewUsername("");
				setEmployeesWithoutAccount((prevEmployees) =>
					prevEmployees.filter((employee) => employee.id !== values.employeeId)
				);
				await refetch();
			} finally {
				setIsPending(false);
			}
		},
		[refetch, setEmployeesWithoutAccount, newUsername]
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
			title: "Nuovo Account",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutAccount.length === 0 ? (
						<div className="text-center text-gray-500 py-4">
							Tutti i Dipendenti hanno già un Account
						</div>
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
												generateUsername(
													employeesWithoutAccount.find(
														(employee) => employee.id === parseInt(value, 10)
													)
												);
											}}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona un Dipendente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													{employeesWithoutAccount.map((employee) => (
														<SelectItem key={employee.id} value={employee.id.toString()}>
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
										<FormLabel>Nome utente</FormLabel>
										<Input value={newUsername} disabled />
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<Input {...field} type="password" />
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

	
	const [pendingAccounts, setPendingAccounts] = useState<AccountListItem[]>([]);

	const refreshPending = useCallback(async () => {
		const pending = await listPendingAccounts();
		setPendingAccounts(pending);
	}, []);

	useEffect(() => {
		void refreshPending();
	}, [refreshPending, accounts]);

return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Account">
			<>
				<PendingApprovals
					pending={pendingAccounts}
					onApproved={() => {
						void refreshPending();
						void refetch();
					}}
					onRejected={() => {
						void refreshPending();
						void refetch();
					}}
				/>
				<Dashboard
					actions={actions}
					table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={accounts}
						entityLabel="Account"
						filters={["username"]}
						facetedFilters={["roleLabel", "approvedLabel"]}
						filterLabels={{
							username: "Nome utente",
							roleLabel: "Ruolo",
							approvedLabel: "Approvazione",
							employeeId: "Dipendente",
						}}
						server={{
							query,
							onQueryChange: setQuery,
							total,
							facetOptions: facets,
						}}
					/>
				}
			/>
					</>
		</EntityShell>
	);
}
