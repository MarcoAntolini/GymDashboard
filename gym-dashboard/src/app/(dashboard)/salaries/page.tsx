"use client";

import Dashboard from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { deleteSalary, editSalary, listSalaries } from "@/data-access/salaries";
import { useEntityList } from "@/hooks/useEntityList";
import { Salary } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import { columns } from "./columns";

export default function Salaries() {
	const {
		data: salaries,
		total,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		handleDelete,
		handleEdit,
	} = useEntityList<Salary, "paymentId">(
		useMemo(
			() => ({
				list: listSalaries,
				deleteAction: deleteSalary,
				editAction: editSalary,
			}),
			[]
		),
		["paymentId"]
	);

	return (
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Stipendio">
			<Dashboard
				actions={[]}
				createGuidance={
					<>
						Gli Stipendi si creano da{" "}
						<Link
							href="/payments"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Pagamenti
						</Link>
						, scegliendo tipo Stipendio.
					</>
				}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={salaries}
						entityLabel="Stipendio"
						emptyGuidance="Registra uno Stipendio da Pagamenti (tipo Stipendio)."
						filters={["employeeId", "paymentId"]}
						filterLabels={{
							employeeId: "ID Dipendente",
							paymentId: "ID Pagamento",
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
