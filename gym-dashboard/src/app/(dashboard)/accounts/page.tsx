"use client";

import { Button } from "@/components/ui/button";
import Dashboard, { Action } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { getAllAccounts } from "@/data-access/accounts";
import { Account } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { columns } from "./columns";

export default function Accounts() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	useEffect(() => {
		function fetchAccounts() {
			getAllAccounts().then(setAccounts);
		}
		fetchAccounts();
	}, []);

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
		},
	];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns}
					data={accounts}
					filters={["username"]}
					facetedFilters={["role", "approved"]}
				/>
			}
		/>
	);
}
