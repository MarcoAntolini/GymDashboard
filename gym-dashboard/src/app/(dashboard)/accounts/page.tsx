"use client";

import { Button } from "@/components/ui/button";
import Dashboard, { Action } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteAccount, editAccount, getAllAccounts } from "@/data-access/accounts";
import { useEntityData } from "@/hooks/useEntityData";
import { Account } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useMemo } from "react";
import { columns } from "./columns";

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

	const actions: Action[] = [
		{
			title: "Add Account",
			icon: PlusCircle,
			dialogContent: (
				<>
					{/* TODO: aggiungi account per un employee senza account */}
					<Button
						onClick={() => {
							setAccounts((prev) => [
								...prev,
								{ username: "mock", password: "mock", role: "Admin", approved: true, employeeId: 90 },
							]);
						}}
						variant="outline"
					>
						Test
					</Button>
				</>
			),
			// TODO: sistemare
			formData: {
				formSchema: undefined,
				defaultValues: {
				},
				submitAction: async () => {},

			},
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
