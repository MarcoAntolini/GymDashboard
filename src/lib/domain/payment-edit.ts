import { PaymentType } from "@prisma/client";

/** User-facing message when edit tries to change Pagamento tipo (specialty create-only). */
export const PAYMENT_TYPE_IMMUTABLE_MESSAGE =
	"Il tipo del Pagamento non è modificabile: la specializzazione (Stipendio, Bolletta, Attrezzatura, Intervento) nasce solo in creazione. Per un tipo diverso registra un nuovo Pagamento.";

/**
 * Specialty rows are create-only: changing `type` on edit would leave
 * Stipendio/Bolletta/Attrezzatura/Intervento inconsistent with the parent Pagamento.
 */
export function assertPaymentTypeUnchanged(
	currentType: PaymentType,
	nextType: PaymentType
): void {
	if (currentType !== nextType) {
		throw new Error(PAYMENT_TYPE_IMMUTABLE_MESSAGE);
	}
}
