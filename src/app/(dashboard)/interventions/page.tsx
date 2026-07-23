"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteIntervention, editIntervention, getAllInterventions } from "@/data-access/interventions";
import { useEntityData } from "@/hooks/useEntityData";
import { Intervention } from "@prisma/client";
import { useMemo } from "react";
import { columns } from "./columns";

export default function InterventionsPage() {
	const {
		data: interventions,
		setData: setInterventions,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Intervention, "paymentId">(
		useMemo(
			() => ({
				getAll: getAllInterventions,
				deleteAction: deleteIntervention,
				editAction: async (entity: Intervention) => {
					await editIntervention({
						paymentId: entity.paymentId,
						description: entity.description,
						maker: entity.maker,
						startingTime: entity.startingTime,
						endingTime: entity.endingTime,
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
			table={
				<DataTable columns={columns(handleDelete, handleEdit)} data={interventions} filters={["paymentId", "maker"]} />
			}
		/>
	);
}
