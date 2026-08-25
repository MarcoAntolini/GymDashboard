"use client";

import * as React from "react";

/** Sorgenti indipendenti del pavimento di larghezza; vince la più larga. */
export type ColumnMinSizeSource = "header" | "content";

type ColumnLayoutApi = {
	moveColumn: (columnId: string, direction: -1 | 1) => void;
	/** Registra il pavimento misurato da una sorgente (sovrascrive la misura precedente della stessa). */
	setColumnMinSize: (
		source: ColumnMinSizeSource,
		columnId: string,
		minSize: number
	) => void;
	/** Le misure in px cambiano con lo swap del webfont: usare come dipendenza per rimisurare. */
	fontsReady: boolean;
};

const ColumnLayoutContext = React.createContext<ColumnLayoutApi | null>(null);

export function ColumnLayoutProvider({
	moveColumn,
	setColumnMinSize,
	fontsReady,
	children,
}: {
	moveColumn: ColumnLayoutApi["moveColumn"];
	setColumnMinSize: ColumnLayoutApi["setColumnMinSize"];
	fontsReady: boolean;
	children: React.ReactNode;
}) {
	const value = React.useMemo(
		() => ({ moveColumn, setColumnMinSize, fontsReady }),
		[moveColumn, setColumnMinSize, fontsReady]
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

/**
 * `next/font` fa swap dopo il primo paint: le larghezze misurate con il fallback
 * non corrispondono a quelle finali. Passa a `true` quando i font sono pronti.
 */
export function useFontsReady(): boolean {
	const [ready, setReady] = React.useState(false);

	React.useEffect(() => {
		if (!document.fonts) {
			setReady(true);
			return;
		}
		let active = true;
		void document.fonts.ready.then(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
		};
	}, []);

	return ready;
}
