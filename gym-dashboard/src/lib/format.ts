import { ContractType, PaymentType } from "@prisma/client";

/** es. "24 ott 2018" — mese abbreviato in italiano, non numerico */
const dateFormatter = new Intl.DateTimeFormat("it-IT", {
	day: "numeric",
	month: "short",
	year: "numeric"
});

/** es. "24 ott 2018, 14:30" */
const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit"
});

const currencyFormatter = new Intl.NumberFormat("it-IT", {
	style: "currency",
	currency: "EUR"
});

/** Strip trailing dots some locales add on short months (e.g. "ott."). */
function tidyDateParts(formatted: string): string {
	return formatted.replace(/\./g, "").replace(/\s+/g, " ").trim();
}

export function formatDateIt(value: Date | string | number): string {
	return tidyDateParts(dateFormatter.format(new Date(value)));
}

export function formatDateTimeIt(value: Date | string | number): string {
	return tidyDateParts(dateTimeFormatter.format(new Date(value)));
}

export function formatCurrencyEur(amount: unknown): string {
	const value =
		typeof amount === "string" || typeof amount === "number"
			? Number(amount)
			: Number(String(amount));
	return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export const paymentTypeLabel: Record<PaymentType, string> = {
	[PaymentType.Salary]: "Stipendio",
	[PaymentType.Bill]: "Bolletta",
	[PaymentType.Equipment]: "Attrezzatura",
	[PaymentType.Intervention]: "Intervento"
};

export const contractTypeLabel: Record<ContractType, string> = {
	[ContractType.FixedTerm]: "Tempo determinato",
	[ContractType.OpenEnded]: "Tempo indeterminato"
};

export function personLabel(
	person: { name: string; surname: string; id?: number } | null | undefined
): string {
	if (!person) return "—";
	const name = `${person.surname} ${person.name}`.trim();
	return person.id != null ? `${name} (#${person.id})` : name;
}
