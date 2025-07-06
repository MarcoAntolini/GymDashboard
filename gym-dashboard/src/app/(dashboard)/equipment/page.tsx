"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteEquipment, editEquipment, getAllEquipment } from "@/data-access/equipment";
import { useEntityData } from "@/hooks/useEntityData";
import { Equipment } from "@prisma/client";
import { useMemo } from "react";
import { columns } from "./columns";

export default function EquipmentPage() {
	const {
		data: equipment,
		setData: setEquipment,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Equipment, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllEquipment,
				deleteAction: deleteEquipment,
				editAction: editEquipment
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
				<DataTable columns={columns(handleDelete, handleEdit)} data={equipment} filters={["paymentId", "provider"]} />
			}
		/>
	);
}
