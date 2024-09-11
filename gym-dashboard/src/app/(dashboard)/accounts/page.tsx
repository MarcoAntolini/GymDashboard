"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAccount, deleteAccount, editAccount, getAllAccounts } from "@/data-access/accounts";
import { getEmployeesWithoutAccount } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { Account, Employee } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { columns } from "./columns";

const createAccountSchema = z.object({
	employeeId: z.number().int().positive(),
	username: z.string().optional(),
	password: z.string(),
});

export default function Accounts() {
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
				editAction: editAccount,
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

	const actions: Action[] = [
		{
			title: "Add Account",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="employeeId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Employee</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(parseInt(value, 10));
										generateUsername(employeesWithoutAccount.find((employee) => employee.id === parseInt(value, 10)));
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
			),
			onDialogClose: () => {
				if (!isPending) {
					setNewUsername("");
				}
			},
			formData: {
				formSchema: createAccountSchema,
				defaultValues: {
					username: "",
					password: "",
				},
				submitAction: handleCreateAccount,
			} as FormData<typeof createAccountSchema>,
		},
	];

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={accounts}
					filters={["username"]}
					facetedFilters={["role", "approved"]}
				/>
			}
		/>
	);
}
