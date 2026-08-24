import type { SemanticTone } from "@/components/ui/domain-badge";
import type { AppRole } from "@/data/nav-routes";
import type { ProductKind } from "@/lib/domain/product-kind";
import { ENTITY_ICON } from "@/lib/domain/icons";
import { ContractType, PaymentType } from "@prisma/client";
import {
	CalendarRange,
	Crown,
	IdCard,
	Infinity as InfinityIcon,
	ShieldCheck,
	type LucideIcon,
} from "lucide-react";

/** Tipo prodotto = specializzazione entità. */
export const PRODUCT_KIND_ICON: Record<ProductKind, LucideIcon> = {
	Membership: ENTITY_ICON.membership,
	EntranceSet: ENTITY_ICON.entranceSet,
};

export const PRODUCT_KIND_TONE: Record<ProductKind, SemanticTone> = {
	Membership: "success",
	EntranceSet: "info",
};

/** Tipo pagamento = specializzazione entità. */
export const PAYMENT_TYPE_ICON: Record<PaymentType, LucideIcon> = {
	[PaymentType.Salary]: ENTITY_ICON.salary,
	[PaymentType.Bill]: ENTITY_ICON.bill,
	[PaymentType.Equipment]: ENTITY_ICON.equipment,
	[PaymentType.Intervention]: ENTITY_ICON.intervention,
};

export const PAYMENT_TYPE_TONE: Record<PaymentType, SemanticTone> = {
	[PaymentType.Salary]: "info",
	[PaymentType.Bill]: "warning",
	[PaymentType.Equipment]: "primary",
	[PaymentType.Intervention]: "muted",
};

/** Ruolo: glifi di tipo, non entità. */
export const ROLE_ICON: Record<AppRole, LucideIcon> = {
	Owner: Crown,
	Admin: ShieldCheck,
	Employee: IdCard,
};

export const ROLE_TONE: Record<AppRole, SemanticTone> = {
	Owner: "warning",
	Admin: "info",
	Employee: "muted",
};

/** Tipo contratto: glifi di tipo, non entità. */
export const CONTRACT_TYPE_ICON: Record<ContractType, LucideIcon> = {
	[ContractType.FixedTerm]: CalendarRange,
	[ContractType.OpenEnded]: InfinityIcon,
};

export const CONTRACT_TYPE_TONE: Record<ContractType, SemanticTone> = {
	[ContractType.FixedTerm]: "warning",
	[ContractType.OpenEnded]: "success",
};
