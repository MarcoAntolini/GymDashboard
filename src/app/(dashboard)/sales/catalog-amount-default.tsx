"use client";

import { getCatalog } from "@/data-access/catalogs";
import { useEffect, useState } from "react";
// react-hook-form types are broken project-wide (see form.tsx); runtime exports are fine.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as RHF from "react-hook-form";

type FormCtx = {
	setValue: (name: string, value: unknown, opts?: { shouldValidate?: boolean }) => void;
};

const useFormContext = (): FormCtx =>
	(RHF as unknown as { useFormContext: () => FormCtx }).useFormContext();

const useWatch = (opts: { name: string }): unknown =>
	(RHF as unknown as { useWatch: (o: { name: string }) => unknown }).useWatch(opts);

/** Propone l'importo dal Listino (YEAR(date), productCode); l'operatore può sovrascrivere. */
export function CatalogAmountDefault() {
	const { setValue } = useFormContext();
	const date = useWatch({ name: "date" }) as Date | undefined;
	const productCode = useWatch({ name: "productCode" }) as string | undefined;
	const [hint, setHint] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function proposeListinoAmount() {
			if (!date || !productCode) {
				setHint(null);
				return;
			}
			const year = new Date(date).getFullYear();
			const catalog = await getCatalog(year, productCode);
			if (cancelled) return;
			if (!catalog) {
				setHint(
					`Nessuna voce Listino per «${productCode}» nell'anno ${year}. Imposta l'importo manualmente (snapshot sulla Vendita).`
				);
				return;
			}
			setValue("amount", Number(catalog.price).toFixed(2), { shouldValidate: true });
			setHint(
				`Prezzo proposto dal Listino ${year} per «${productCode}». Resta snapshot sulla Vendita anche se il Listino cambia dopo.`
			);
		}

		void proposeListinoAmount();
		return () => {
			cancelled = true;
		};
	}, [date, productCode, setValue]);

	if (!hint) return null;

	return <p className="text-sm text-muted-foreground">{hint}</p>;
}
