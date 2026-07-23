import type { ColumnClass } from "@/lib/domain/view-columns";

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		/** View column class from VIEW_COLUMN_MATRIX (ticket 10). */
		columnClass?: ColumnClass;
	}
}

export {};
