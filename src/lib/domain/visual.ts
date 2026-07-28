import type { SemanticTone } from "@/components/ui/domain-badge";
import type { ProductKind } from "@/lib/domain/product-kind";
import type { ContractType, PaymentType, Role } from "@prisma/client";

/** Dot tone per categorie di dominio (chip outline+dot). */
export const PAYMENT_TYPE_TONE: Record<PaymentType, SemanticTone> = {
	Salary: "info",
	Bill: "warning",
	Equipment: "primary",
	Intervention: "muted",
};

export const PRODUCT_KIND_TONE: Record<ProductKind, SemanticTone> = {
	Membership: "success",
	EntranceSet: "info",
};

export const ROLE_TONE: Record<Role, SemanticTone> = {
	Owner: "warning",
	Admin: "info",
	Employee: "muted",
};

export const CONTRACT_TYPE_TONE: Record<ContractType, SemanticTone> = {
	FixedTerm: "warning",
	OpenEnded: "success",
};
