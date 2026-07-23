"use client";

import Dashboard from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { deleteIntervention, editIntervention, listInterventions } from "@/data-access/interventions";
import { useEntityList } from "@/hooks/useEntityList";
import { Intervention } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import { columns } from "./columns";

export default function InterventionsPage() {
	const {
		data: interventions,
		total,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		handleDelete,
		handleEdit,
	} = useEntityList<Intervention, "paymentId">(
		useMemo(
			() => ({
				list: listInterventions,
				deleteAction: deleteIntervention,
				editAction: editIntervention,
			}),
			[]
		),
		["paymentId"]
	);

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Intervento">
			<Dashboard
				actions={[]}
				createGuidance={
					<>
						Gli Interventi si creano da{" "}
						<Link
							href="/payments"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Pagamenti
						</Link>
						, scegliendo tipo Intervento.
					</>
				}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={interventions}
						entityLabel="Intervento"
						emptyGuidance="Registra un Intervento da Pagamenti (tipo Intervento)."
						filters={["paymentId", "maker"]}
						filterLabels={{
							paymentId: "ID Pagamento",
							maker: "Attuatore",
							description: "Descrizione",
							startingTime: "Inizio",
							endingTime: "Fine",
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
