/**
 * Italian labels + specialty summary for Pagamenti (ticket 38).
 * Specialization fields must be inspectable on list/detail, not only at create.
 */

import { PaymentType } from "@prisma/client";
import { formatDateTimeIt } from "./locale";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
	[PaymentType.Salary]: "Stipendio",
	[PaymentType.Bill]: "Bolletta",
	[PaymentType.Equipment]: "Attrezzatura",
	[PaymentType.Intervention]: "Intervento",
};

export type PaymentSpecialtyRelations = {
	type: PaymentType;
	salary?: { employeeId: number } | null;
	bill?: { description: string; provider: string } | null;
	equipment?: { description: string; provider: string } | null;
	intervention?: {
		description: string;
		maker: string;
		startingTime: Date | string;
		endingTime: Date | string;
	} | null;
};

/** Human label for Pagamento tipo (never raw Prisma enum key). */
export function formatPaymentTypeLabel(type: PaymentType | string): string {
	if (type in PAYMENT_TYPE_LABELS) {
		return PAYMENT_TYPE_LABELS[type as PaymentType];
	}
	return String(type);
}

/**
 * Compact specialty summary for list/edit inspection.
 * Returns "—" if the expected specialty row is missing.
 */
export function formatPaymentSpecialtySummary(
	payment: PaymentSpecialtyRelations
): string {
	switch (payment.type) {
		case PaymentType.Salary: {
			const salary = payment.salary;
			if (!salary) return "—";
			return `Dipendente #${salary.employeeId}`;
		}
		case PaymentType.Bill: {
			const bill = payment.bill;
			if (!bill) return "—";
			return `${bill.description} · Fornitore: ${bill.provider}`;
		}
		case PaymentType.Equipment: {
			const equipment = payment.equipment;
			if (!equipment) return "—";
			return `${equipment.description} · Fornitore: ${equipment.provider}`;
		}
		case PaymentType.Intervention: {
			const intervention = payment.intervention;
			if (!intervention) return "—";
			const from = formatDateTimeIt(intervention.startingTime);
			const to = formatDateTimeIt(intervention.endingTime);
			return `${intervention.description} · Esecutore: ${intervention.maker} · ${from} → ${to}`;
		}
		default:
			return "—";
	}
}

/** Multi-line detail lines for edit Sheet (label + value). */
export function paymentSpecialtyDetailLines(
	payment: PaymentSpecialtyRelations
): { label: string; value: string }[] {
	switch (payment.type) {
		case PaymentType.Salary: {
			const salary = payment.salary;
			if (!salary) return [{ label: "Specializzazione", value: "—" }];
			return [{ label: "Dipendente", value: `#${salary.employeeId}` }];
		}
		case PaymentType.Bill: {
			const bill = payment.bill;
			if (!bill) return [{ label: "Specializzazione", value: "—" }];
			return [
				{ label: "Descrizione", value: bill.description },
				{ label: "Fornitore", value: bill.provider },
			];
		}
		case PaymentType.Equipment: {
			const equipment = payment.equipment;
			if (!equipment) return [{ label: "Specializzazione", value: "—" }];
			return [
				{ label: "Descrizione", value: equipment.description },
				{ label: "Fornitore", value: equipment.provider },
			];
		}
		case PaymentType.Intervention: {
			const intervention = payment.intervention;
			if (!intervention) return [{ label: "Specializzazione", value: "—" }];
			return [
				{ label: "Descrizione", value: intervention.description },
				{ label: "Esecutore", value: intervention.maker },
				{ label: "Inizio", value: formatDateTimeIt(intervention.startingTime) },
				{ label: "Fine", value: formatDateTimeIt(intervention.endingTime) },
			];
		}
		default:
			return [{ label: "Specializzazione", value: "—" }];
	}
}
