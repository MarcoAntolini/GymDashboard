/**
 * Domain visual mappings for DotBadge / DomainBadge (ticket 41).
 * Categories → outline+dot; actionable states → soft badge + icon.
 */

import type { DomainTone } from "@/components/ui/domain-badge";
import type { ProductKind } from "@/lib/domain/product-kind";
import { PRODUCT_KIND_LABELS } from "@/lib/domain/product-kind";
import { PAYMENT_TYPE_LABELS } from "@/lib/format/payment-specialty";
import { ContractType, PaymentType, Role } from "@prisma/client";
import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	Package,
	type LucideIcon,
	XCircle,
} from "lucide-react";

export const ROLE_LABELS: Record<Role, string> = {
	[Role.Owner]: "Proprietario",
	[Role.Admin]: "Amministratore",
	[Role.Employee]: "Dipendente",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
	[ContractType.FixedTerm]: "Tempo determinato",
	[ContractType.OpenEnded]: "Tempo indeterminato",
};

export function paymentTypeTone(type: PaymentType): DomainTone {
	switch (type) {
		case PaymentType.Salary:
			return "neutral";
		case PaymentType.Bill:
			return "warning";
		case PaymentType.Equipment:
			return "info";
		case PaymentType.Intervention:
			return "primary";
		default:
			return "neutral";
	}
}

export function paymentTypeChip(type: PaymentType): {
	label: string;
	tone: DomainTone;
} {
	return {
		label: PAYMENT_TYPE_LABELS[type] ?? String(type),
		tone: paymentTypeTone(type),
	};
}

export function productKindTone(kind: ProductKind): DomainTone {
	return kind === "Membership" ? "success" : "info";
}

export function productKindChip(kind: ProductKind | null | undefined): {
	label: string;
	tone: DomainTone;
} | null {
	if (!kind) return null;
	return {
		label: PRODUCT_KIND_LABELS[kind],
		tone: productKindTone(kind),
	};
}

export function roleTone(role: Role): DomainTone {
	switch (role) {
		case Role.Owner:
			return "primary";
		case Role.Admin:
			return "warning";
		case Role.Employee:
			return "neutral";
		default:
			return "neutral";
	}
}

export function roleChip(role: Role): { label: string; tone: DomainTone } {
	return {
		label: ROLE_LABELS[role] ?? String(role),
		tone: roleTone(role),
	};
}

export function contractTypeTone(type: ContractType): DomainTone {
	return type === ContractType.OpenEnded ? "info" : "warning";
}

export function contractTypeChip(type: ContractType): {
	label: string;
	tone: DomainTone;
} {
	return {
		label: CONTRACT_TYPE_LABELS[type] ?? String(type),
		tone: contractTypeTone(type),
	};
}

export type ApprovalVisual = {
	label: string;
	tone: DomainTone;
	icon: LucideIcon;
};

export function approvalStatusVisual(approved: boolean): ApprovalVisual {
	if (approved) {
		return {
			label: "Approvato",
			tone: "success",
			icon: CheckCircle2,
		};
	}
	return {
		label: "In attesa",
		tone: "warning",
		icon: Clock3,
	};
}

/** Residuo pacchetto: soft status badge (not a category chip). */
export function remainingEntrancesVisual(
	remaining: number | null | undefined
): ApprovalVisual | null {
	if (remaining == null) return null;
	if (remaining <= 0) {
		return {
			label: "Esaurito",
			tone: "destructive",
			icon: XCircle,
		};
	}
	if (remaining <= 3) {
		return {
			label: `${remaining} residui`,
			tone: "warning",
			icon: AlertTriangle,
		};
	}
	return {
		label: `${remaining} residui`,
		tone: "success",
		icon: Package,
	};
}
