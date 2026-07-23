"use client";

import {
	previewEntranceJustification,
	type EntranceJustificationPreview
} from "@/data-access/entrances";
import { formatDateIt } from "@/lib/format";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { formSchema } from "./columns";

function previewTone(preview: EntranceJustificationPreview | null): string {
	if (!preview) return "text-muted-foreground";
	if (preview.purchaseId == null) return "text-destructive";
	return "text-foreground";
}

export function EntranceJustificationPreviewField() {
	const form = useFormContext<z.infer<typeof formSchema>>();
	const clientId = form.watch("clientId");
	const date = form.watch("date");
	const [preview, setPreview] = useState<EntranceJustificationPreview | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function loadPreview() {
			if (!clientId || clientId <= 0 || !(date instanceof Date)) {
				setPreview({
					purchaseId: null,
					kind: null,
					productCode: null,
					residualAfter: null,
					membershipEndsExclusive: null,
					message: "Seleziona Cliente e data: l'Acquisto giustificante è scelto automaticamente."
				});
				return;
			}

			setIsLoading(true);
			try {
				const next = await previewEntranceJustification(clientId, date);
				if (!cancelled) setPreview(next);
			} catch {
				if (!cancelled) {
					setPreview({
						purchaseId: null,
						kind: null,
						productCode: null,
						residualAfter: null,
						membershipEndsExclusive: null,
						message: "Impossibile calcolare la giustificazione. Riprova."
					});
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void loadPreview();
		return () => {
			cancelled = true;
		};
	}, [clientId, date]);

	return (
		<div
			className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-pretty"
			role="status"
			aria-live="polite"
		>
			<p className="font-medium text-foreground">Giustificazione (Acquisto)</p>
			<p className="mt-1 text-muted-foreground">
				Priorità: Abbonamento valido più recente; altrimenti Pacchetto con residuo (FIFO).
			</p>
			<p className={`mt-2 ${previewTone(preview)}`}>
				{isLoading ? "Calcolo giustificazione…" : (preview?.message ?? "—")}
			</p>
			{preview?.kind === "Abbonamento" && preview.membershipEndsExclusive ? (
				<p className="mt-1 text-muted-foreground tabular-nums">
					Validità Abbonamento fino al {formatDateIt(preview.membershipEndsExclusive)} (escluso).
				</p>
			) : null}
			{preview?.kind === "Pacchetto" && preview.residualAfter != null ? (
				<p className="mt-1 text-muted-foreground tabular-nums">
					Ingressi rimanenti sull&apos;Acquisto dopo la registrazione: {preview.residualAfter}.
				</p>
			) : null}
		</div>
	);
}
