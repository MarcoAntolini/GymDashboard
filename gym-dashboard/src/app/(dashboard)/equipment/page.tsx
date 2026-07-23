"use client";

import Dashboard from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { deleteEquipment, editEquipment, listEquipment } from "@/data-access/equipment";
import { useEntityList } from "@/hooks/useEntityList";
import { Equipment } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import { columns } from "./columns";

export default function EquipmentPage() {
	const {
		data: equipment,
		total,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		handleDelete,
		handleEdit,
	} = useEntityList<Equipment, "paymentId">(
		useMemo(
			() => ({
				list: listEquipment,
				deleteAction: deleteEquipment,
				editAction: editEquipment,
			}),
			[]
		),
		["paymentId"]
	);

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Attrezzatura">
			<Dashboard
				actions={[]}
				createGuidance={
					<>
						Le Attrezzature si creano da{" "}
						<Link
							href="/payments"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Pagamenti
						</Link>
						, scegliendo tipo Attrezzatura.
					</>
				}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={equipment}
						entityLabel="Attrezzatura"
						emptyGuidance="Registra un’Attrezzatura da Pagamenti (tipo Attrezzatura)."
						filters={["paymentId", "provider"]}
						filterLabels={{
							paymentId: "ID Pagamento",
							provider: "Fornitore",
							description: "Descrizione",
						}}
						server={{
							query,
							onQueryChange: setQuery,
							total,
						}}
					/>
				}
			/>
		</EntityShell>
	);
}
