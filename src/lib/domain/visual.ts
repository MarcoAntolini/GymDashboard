import type { AppRole } from "@/data/nav-routes";
import type { SemanticTone } from "@/components/ui/domain-badge";
import type { ProductKind } from "@/lib/domain/product-kind";
import { ContractType, PaymentType } from "@prisma/client";

/** Dot tone per categorie di dominio (chip outline+dot). */
export const PAYMENT_TYPE_TONE: Record<PaymentType, SemanticTone> = {
	[PaymentType.Salary]: "info",
	[PaymentType.Bill]: "warning",
	[PaymentType.Equipment]: "primary",
	[PaymentType.Intervention]: "muted",
};

export const PRODUCT_KIND_TONE: Record<ProductKind, SemanticTone> = {
	Membership: "success",
	EntranceSet: "info",
};

export const ROLE_TONE: Record<AppRole, SemanticTone> = {
	Owner: "warning",
	Admin: "info",
	Employee: "muted",
};

export const CONTRACT_TYPE_TONE: Record<ContractType, SemanticTone> = {
	[ContractType.FixedTerm]: "warning",
	[ContractType.OpenEnded]: "success",
};
