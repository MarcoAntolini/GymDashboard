"use client";

import Dashboard from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { deleteBill, editBill, listBills } from "@/data-access/bills";
import { useEntityList } from "@/hooks/useEntityList";
import { Bill } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import { columns } from "./columns";

export default function BillsPage() {
	const {
		data: bills,
		total,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		handleDelete,
		handleEdit,
	} = useEntityList<Bill, "paymentId">(
		useMemo(
			() => ({
				list: listBills,
				deleteAction: deleteBill,
				editAction: editBill,
			}),
			[]
		),
		["paymentId"]
	);

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Bolletta">
			<Dashboard
				actions={[]}
				createGuidance={
					<>
						Le Bollette si creano da{" "}
						<Link
							href="/payments"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Pagamenti
						</Link>
						, scegliendo tipo Bolletta.
					</>
				}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={bills}
						entityLabel="Bolletta"
						emptyGuidance="Registra una Bolletta da Pagamenti (tipo Bolletta)."
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
