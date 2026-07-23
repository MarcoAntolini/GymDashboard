"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";

/** Stable column id injected by DataTable for multi-select. */
export const SELECT_COLUMN_ID = "select";

export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
	return {
		id: SELECT_COLUMN_ID,
		enableHiding: false,
		enableSorting: false,
		size: 40,
		header: ({ table }) => (
			<div className="flex items-center justify-center pr-2">
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Seleziona tutte le righe della pagina"
					onClick={(event) => event.stopPropagation()}
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center pr-2">
				<Checkbox
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Seleziona riga"
					onClick={(event) => event.stopPropagation()}
				/>
			</div>
		),
	};
}
