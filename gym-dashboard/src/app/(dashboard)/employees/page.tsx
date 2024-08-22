"use client"

import Dashboard, { Action } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { getAllEmployees } from "@/data-access/employees";
import { columns } from "./columns";
import { Employee } from "@prisma/client";
import { useEffect, useState } from "react";

export default function Employees() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	useEffect(() => {
		function fetchEmployees() {
			getAllEmployees().then(setEmployees);
		}
		fetchEmployees();
	}, []);

	const actions: Action[] = [];

	return (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns}
					data={employees}
					filters={["taxCode", "name", "surname"]}
					facetedFilters={["city", "province"]}
				/>
			}
		/>
	);
}
