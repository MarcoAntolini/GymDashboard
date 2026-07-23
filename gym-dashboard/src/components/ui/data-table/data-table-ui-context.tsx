"use client";

import * as React from "react";

export type DataTableUiContextValue = {
	moveColumn: (columnId: string, direction: -1 | 1) => void;
	resetColumnLayout: () => void;
};

const DataTableUiContext = React.createContext<DataTableUiContextValue | null>(null);

export function DataTableUiProvider({
	value,
	children,
}: {
	value: DataTableUiContextValue;
	children: React.ReactNode;
}) {
	return <DataTableUiContext.Provider value={value}>{children}</DataTableUiContext.Provider>;
}

export function useDataTableUi(): DataTableUiContextValue | null {
	return React.useContext(DataTableUiContext);
}
