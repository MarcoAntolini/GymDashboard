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

/** Tipo pagamento = specializzazione entità. */
export const PAYMENT_TYPE_ICON: Record<PaymentType, LucideIcon> = {
	[PaymentType.Salary]: ENTITY_ICON.salary,
	[PaymentType.Bill]: ENTITY_ICON.bill,
	[PaymentType.Equipment]: ENTITY_ICON.equipment,
	[PaymentType.Intervention]: ENTITY_ICON.intervention,
};

/** Ruolo: glifi di tipo, non entità. */
export const ROLE_ICON: Record<AppRole, LucideIcon> = {
	Owner: Crown,
	Admin: ShieldCheck,
	Employee: IdCard,
};

/** Tipo contratto: glifi di tipo, non entità. */
export const CONTRACT_TYPE_ICON: Record<ContractType, LucideIcon> = {
	[ContractType.FixedTerm]: CalendarRange,
	[ContractType.OpenEnded]: InfinityIcon,
};
