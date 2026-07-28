"use client";

import { FormDateField } from "@/components/ui/form-date-field";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { contractRequiresEndingDate } from "@/lib/contract-term";
import { ContractType } from "@prisma/client";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

type EndingDateFieldProps = {
	/** Kept for callers; both variants now use the shared Calendar + formatDateIt chrome. */
	variant?: "calendar" | "input";
};

/**
 * Mostra/richiede data fine solo per tempo determinato.
 * Su passaggio a indeterminato azzera endingDate.
 */
export function ContractEndingDateField(_props: EndingDateFieldProps = {}) {
	const { watch, setValue } = useFormContext();
	const type = watch("type") as ContractType;
	const showEnding = contractRequiresEndingDate(type);

	useEffect(() => {
		if (!showEnding) {
			setValue("endingDate", undefined, { shouldValidate: true });
		}
	}, [showEnding, setValue]);

	if (!showEnding) {
		return null;
	}

	return (
		<FormField
			name="endingDate"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Data fine</FormLabel>
					<FormDateField
						value={field.value}
						onChange={field.onChange}
						disabledDates={(date) => date < new Date("1900-01-01")}
						defaultMonth={field.value || new Date()}
					/>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
