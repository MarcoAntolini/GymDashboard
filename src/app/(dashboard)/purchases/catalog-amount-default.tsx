"use client";

import { getCatalog } from "@/data-access/catalogs";
import { catalogYearFromDate } from "@/lib/domain/purchase-amount";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * Proposes Listino price as create amount default when date + productCode change.
 * Operator may override for sconto; this does not persist tipo.
 */
export function CatalogAmountDefault() {
	const { setValue } = useFormContext();
	const date = useWatch({ name: "date" }) as Date | undefined;
	const productCode = useWatch({ name: "productCode" }) as string | undefined;

	useEffect(() => {
		let cancelled = false;

		async function loadCatalogPrice() {
			if (!(date instanceof Date) || !productCode) {
				return;
			}
			const catalog = await getCatalog(catalogYearFromDate(date), productCode);
			if (cancelled || !catalog) {
				return;
			}
			setValue("amount", catalog.price, { shouldDirty: true, shouldValidate: true });
		}

		void loadCatalogPrice();
		return () => {
			cancelled = true;
		};
	}, [date, productCode, setValue]);

	return null;
}
