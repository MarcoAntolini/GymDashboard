import { ContractType, PaymentType, Role } from "@prisma/client";

/** Etichette IT per tipi Pagamento (CONTEXT.md). */
export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
	Salary: "Stipendio",
	Bill: "Bolletta",
	Equipment: "Attrezzatura",
	Intervention: "Intervento",
};

/** Etichette IT per tipi Contratto. */
export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
	FixedTerm: "Tempo determinato",
	OpenEnded: "Tempo indeterminato",
};

/** Etichette IT per ruoli Account. */
export const ROLE_LABEL: Record<Role, string> = {
	Owner: "Proprietario",
	Admin: "Amministratore",
	Employee: "Dipendente",
};

export function formatPersonLabel(person: {
	name: string;
	surname: string;
	id?: number;
}): string {
	const name = `${person.surname} ${person.name}`;
	return person.id != null ? `${name} (#${person.id})` : name;
}
