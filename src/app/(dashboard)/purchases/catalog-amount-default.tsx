"use client";

import { getCatalog } from "@/data-access/catalogs";
import { useEffect } from "react";
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

	useEffect(() => {
		let cancelled = false;

		async function proposeListinoAmount() {
			if (!date || !productCode) return;
			const catalog = await getCatalog(new Date(date).getFullYear(), productCode);
			if (cancelled || !catalog) return;
			setValue("amount", Number(catalog.price).toFixed(2), { shouldValidate: true });
		}

		void proposeListinoAmount();
		return () => {
			cancelled = true;
		};
	}, [date, productCode, setValue]);

	return null;
}
