"use client";

import * as React from "react";

type ColumnLayoutApi = {
	moveColumn: (columnId: string, direction: -1 | 1) => void;
	/** Imposta il pavimento di larghezza dalla misura dell'header (titolo + chrome). */
	ensureHeaderMinSize: (columnId: string, minSize: number) => void;
};

const ColumnLayoutContext = React.createContext<ColumnLayoutApi | null>(null);

export function ColumnLayoutProvider({
	moveColumn,
	ensureHeaderMinSize,
	children,
}: {
	moveColumn: ColumnLayoutApi["moveColumn"];
	ensureHeaderMinSize: ColumnLayoutApi["ensureHeaderMinSize"];
	children: React.ReactNode;
}) {
	const value = React.useMemo(
		() => ({ moveColumn, ensureHeaderMinSize }),
		[moveColumn, ensureHeaderMinSize]
	);
	return (
		<ColumnLayoutContext.Provider value={value}>
			{children}
		</ColumnLayoutContext.Provider>
	);
}

export function useColumnLayout(): ColumnLayoutApi | null {
	return React.useContext(ColumnLayoutContext);
}
