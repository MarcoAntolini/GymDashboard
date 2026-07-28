"use client";

import * as React from "react";

type ColumnLayoutApi = {
	moveColumn: (columnId: string, direction: -1 | 1) => void;
};

const ColumnLayoutContext = React.createContext<ColumnLayoutApi | null>(null);

export function ColumnLayoutProvider({
	moveColumn,
	children,
}: {
	moveColumn: ColumnLayoutApi["moveColumn"];
	children: React.ReactNode;
}) {
	const value = React.useMemo(() => ({ moveColumn }), [moveColumn]);
	return (
		<ColumnLayoutContext.Provider value={value}>
			{children}
		</ColumnLayoutContext.Provider>
	);
}

export function useColumnLayout(): ColumnLayoutApi | null {
	return React.useContext(ColumnLayoutContext);
}
