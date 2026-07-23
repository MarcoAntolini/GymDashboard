"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteSalary, editSalary, getAllSalaries } from "@/data-access/salaries";
import { useEntityData } from "@/hooks/useEntityData";
import { Salary } from "@prisma/client";
import { useMemo } from "react";
import { columns } from "./columns";

export default function Salaries() {
	const {
		data: salaries,
		setData: setSalaries,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Salary, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllSalaries,
				deleteAction: deleteSalary,
				editAction: editSalary
			}),
			[]
		),
		["paymentId"]
	);

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
			table={
				<DataTable columns={columns(handleDelete, handleEdit)} data={salaries} filters={["employeeId", "paymentId"]} />
			}
		/>
	);
}
