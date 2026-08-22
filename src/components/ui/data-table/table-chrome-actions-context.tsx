"use client";

import * as React from "react";

const TableChromeActionsContext = React.createContext<React.ReactNode>(null);

export function TableChromeActionsProvider({
	actions,
	children,
}: {
	actions: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<TableChromeActionsContext.Provider value={actions}>
			{children}
		</TableChromeActionsContext.Provider>
	);
}

export function useTableChromeActions(): React.ReactNode {
	return React.useContext(TableChromeActionsContext);
}
