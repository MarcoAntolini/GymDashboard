import type { AppRole } from "@/data/nav-routes";
import { ContractType, PaymentType } from "@prisma/client";

/** Etichette IT per tipi Pagamento (CONTEXT.md). */
export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
	[PaymentType.Salary]: "Stipendio",
	[PaymentType.Bill]: "Bolletta",
	[PaymentType.Equipment]: "Attrezzatura",
	[PaymentType.Intervention]: "Intervento",
};

/** Etichette IT per tipi Contratto. */
export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
	[ContractType.FixedTerm]: "Tempo determinato",
	[ContractType.OpenEnded]: "Tempo indeterminato",
};

/** Etichette IT per ruoli Account (chiavi UI/sessione, non valori DB Prisma 7). */
export const ROLE_LABEL: Record<AppRole, string> = {
	Owner: "Proprietario",
	Admin: "Amministratore",
	Employee: "Dipendente",
};

export function formatPersonName(person: {
	name: string;
	surname: string;
}): string {
	return `${person.surname} ${person.name}`;
}

export function formatPersonLabel(person: {
	name: string;
	surname: string;
	id?: number;
}): string {
	const name = formatPersonName(person);
	return person.id != null ? `${name} (#${person.id})` : name;
}
