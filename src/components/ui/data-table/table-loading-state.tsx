"use client";

import { BeatLoader } from "react-spinners";

/** Loading coerente nel corpo tabella (toolbar resta visibile). */
export function TableLoadingState() {
	return (
		<div
			role="status"
			aria-live="polite"
			aria-busy="true"
			className="flex flex-col items-center justify-center gap-2 py-6"
		>
			<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
			<span className="sr-only">Caricamento in corso</span>
		</div>
	);
}
