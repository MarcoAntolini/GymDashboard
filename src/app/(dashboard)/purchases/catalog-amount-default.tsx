"use client";

import { getCatalog } from "@/data-access/catalogs";
import { catalogYearFromDate } from "@/lib/domain/purchase-amount";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * Proposes Listino price as create amount default when date + productCode change.
 * Operator may override for sconto; this does not persist tipo.
 * Shows which Listino year seeds the snapshot importo (ticket 38).
 */
export function CatalogAmountDefault() {
	const { setValue } = useFormContext();
	const date = useWatch({ name: "date" }) as Date | undefined;
	const productCode = useWatch({ name: "productCode" }) as string | undefined;
	const [hint, setHint] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadCatalogPrice() {
			if (!(date instanceof Date) || !productCode) {
				if (!cancelled) setHint(null);
				return;
			}
			const year = catalogYearFromDate(date);
			const catalog = await getCatalog(year, productCode);
			if (cancelled) return;
			if (!catalog) {
				setHint(
					`Nessun prezzo Listino per anno ${year} e prodotto ${productCode}: inserisci l'importo manualmente.`
				);
				return;
			}
			setValue("amount", catalog.price, { shouldDirty: true, shouldValidate: true });
			setHint(
				`Importo proposto dal Listino ${year} (puoi modificarlo per uno sconto). Resta snapshot sull'Acquisto.`
			);
		}

		void loadCatalogPrice();
		return () => {
			cancelled = true;
		};
	}, [date, productCode, setValue]);

	if (!hint) return null;

	return (
		<p className="text-sm text-muted-foreground" role="status">
			{hint}
		</p>
	);
}
