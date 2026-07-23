"use client";

import { ContractType } from "@prisma/client";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * Shows ending-date controls only for FixedTerm (tempo determinato).
 * Clears endingDate when switching to OpenEnded so validation stays aligned.
 */
export function ContractEndingDateField({ children }: { children: React.ReactNode }) {
	const { setValue } = useFormContext();
	const type = useWatch({ name: "type" }) as ContractType | undefined;

	useEffect(() => {
		if (type === ContractType.OpenEnded) {
			setValue("endingDate", undefined, { shouldValidate: true, shouldDirty: true });
		}
	}, [type, setValue]);

	if (type !== ContractType.FixedTerm) {
		return null;
	}

	return <>{children}</>;
}
