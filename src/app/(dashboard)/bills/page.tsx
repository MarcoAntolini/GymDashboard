"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteBill, editBill, getAllBills } from "@/data-access/bills";
import { useEntityData } from "@/hooks/useEntityData";
import { Bill } from "@prisma/client";
import { useMemo } from "react";
import { columns } from "./columns";

export default function BillsPage() {
	const {
		data: bills,
		setData: setBills,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Bill, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllBills,
				deleteAction: deleteBill,
				editAction: async (entity: Bill) => {
					await editBill({
						paymentId: entity.paymentId,
						description: entity.description,
						provider: entity.provider,
					});
					return entity;
				},
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
			table={<DataTable columns={columns(handleDelete, handleEdit)} data={bills} filters={["paymentId", "provider"]} />}
		/>
	);
}
