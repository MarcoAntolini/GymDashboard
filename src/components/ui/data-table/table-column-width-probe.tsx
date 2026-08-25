"use client";

import * as React from "react";
import { TABLE_CELL_PAD_X } from "./table-column-layout";

export type ColumnWidthSample = {
	columnId: string;
	node: React.ReactNode;
};

/**
 * Misura fuori schermo i contenuti peggiori dichiarati da `meta.widthSamples` e
 * registra il pavimento di larghezza della colonna. Serve perché il badge più
 * largo che una colonna *può* mostrare non è necessariamente quello renderizzato
 * nella pagina corrente: misurare le celle visibili darebbe larghezze instabili.
 */
export function ColumnWidthProbe({
	samples,
	fontsReady,
	onMeasure,
}: {
	samples: ColumnWidthSample[];
	fontsReady: boolean;
	onMeasure: (columnId: string, minSize: number) => void;
}) {
	const rootRef = React.useRef<HTMLDivElement>(null);
	const columnIds = samples.map((sample) => sample.columnId).join("|");

	React.useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const widest = new Map<string, number>();
		root.querySelectorAll<HTMLElement>("[data-width-sample]").forEach((el) => {
			const columnId = el.dataset.widthSample;
			if (!columnId) return;
			const width = el.getBoundingClientRect().width;
			widest.set(columnId, Math.max(widest.get(columnId) ?? 0, width));
		});

		widest.forEach((width, columnId) => {
			onMeasure(columnId, Math.ceil(width) + TABLE_CELL_PAD_X * 2);
		});
	}, [columnIds, fontsReady, onMeasure]);

	if (samples.length === 0) return null;

	return (
		<div
			ref={rootRef}
			aria-hidden
			// `fixed` tiene il probe fuori dall'overflow scrollabile della pagina.
			className="pointer-events-none invisible fixed left-0 top-0 -z-50 h-0 w-max overflow-hidden"
		>
			{samples.map((sample, index) => (
				<div
					key={`${sample.columnId}-${index}`}
					data-width-sample={sample.columnId}
					className="w-max whitespace-nowrap"
				>
					{sample.node}
				</div>
			))}
		</div>
	);
}
