"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";

/** Leading checkbox column for page-scoped multi-select (ticket 42). */
export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
	return {
		id: "select",
		enableSorting: false,
		enableHiding: false,
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) =>
					table.toggleAllPageRowsSelected(!!value)
				}
				aria-label="Seleziona tutte le righe della pagina"
				onClick={(e) => e.stopPropagation()}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				disabled={!row.getCanSelect()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Seleziona riga"
				onClick={(e) => e.stopPropagation()}
			/>
		),
	};
}
