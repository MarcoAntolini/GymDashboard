"use client";

import { RemainingEntrancesBadge } from "@/components/ui/domain-badge";
import { previewEntranceJustification } from "@/data-access/entrances";
import { ProductKind } from "@/lib/domain/product-kind";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

type PreviewState =
	| { status: "idle" }
	| { status: "loading" }
	| ({ status: "ready" } & Awaited<ReturnType<typeof previewEntranceJustification>>);

export function EntranceJustificationPreview() {
	const { control } = useFormContext();
	const clientId = useWatch({ control, name: "clientId" }) as number | undefined;
	const date = useWatch({ control, name: "date" }) as Date | undefined;
	const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

	useEffect(() => {
		if (!clientId || clientId <= 0 || !(date instanceof Date) || Number.isNaN(date.getTime())) {
			setPreview({ status: "idle" });
			return;
		}

		let cancelled = false;
		setPreview({ status: "loading" });
		const timer = window.setTimeout(() => {
			void previewEntranceJustification(clientId, date).then((result) => {
				if (!cancelled) setPreview({ status: "ready", ...result });
			});
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [clientId, date]);

	if (preview.status === "idle") {
		return (
			<p className="text-sm text-muted-foreground">
				Seleziona cliente e data per vedere il residuo dopo questo ingresso.
			</p>
		);
	}

	if (preview.status === "loading") {
		return (
			<p className="text-sm text-muted-foreground">Calcolo giustificazione…</p>
		);
	}

	if (!preview.ok) {
		return (
			<div
				role="status"
				className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{preview.message}
			</div>
		);
	}

	const isPackage = preview.kind === ProductKind.EntranceSet;

	return (
		<div
			role="status"
			className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
		>
			<p>
				Vendita #{preview.saleId} · {preview.kindLabel} · {preview.productCode}
			</p>
			{isPackage ? (
				<div className="flex items-center justify-between gap-3">
					<span>Residuo dopo questo ingresso</span>
					<RemainingEntrancesBadge remaining={preview.remainingAfter} />
				</div>
			) : (
				<p className="text-muted-foreground">
					Residuo non applicabile: l'ingresso sarà coperto dall'abbonamento.
				</p>
			)}
		</div>
	);
}
