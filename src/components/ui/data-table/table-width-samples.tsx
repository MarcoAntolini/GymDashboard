"use client";

import { TableCode } from "@/components/ui/data-table/table-cells";
import { DomainBadge, DotBadge } from "@/components/ui/domain-badge";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import {
	CONTRACT_TYPE_LABEL,
	PAYMENT_TYPE_LABEL,
	ROLE_LABEL,
} from "@/lib/domain/labels";
import { PRODUCT_KIND_LABEL, type ProductKind } from "@/lib/domain/product-kind";
import {
	CONTRACT_TYPE_ICON,
	CONTRACT_TYPE_TONE,
	PAYMENT_TYPE_ICON,
	PAYMENT_TYPE_TONE,
	PRODUCT_KIND_ICON,
	PRODUCT_KIND_TONE,
	ROLE_ICON,
	ROLE_TONE,
} from "@/lib/domain/visual";
import type { AppRole } from "@/data/nav-routes";
import { ContractType, PaymentType } from "@prisma/client";
import { Archive } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Contenuti peggiori per `meta.widthSamples`: sono derivati dai dizionari di
 * dominio, così una nuova etichetta allarga automaticamente la colonna invece di
 * essere tagliata.
 */

export function roleBadgeSamples(): ReactNode[] {
	return (Object.keys(ROLE_LABEL) as AppRole[]).map((role) => (
		<DotBadge
			key={role}
			label={ROLE_LABEL[role]}
			icon={ROLE_ICON[role]}
			tone={ROLE_TONE[role]}
		/>
	));
}

export function approvalBadgeSamples(): ReactNode[] {
	return [
		<DomainBadge key="approved" label="Approvato" tone="success" icon={ATTR_ICON.approved} />,
		<DomainBadge key="pending" label="In attesa" tone="warning" icon={ATTR_ICON.pending} />,
	];
}

export function productKindBadgeSamples(): ReactNode[] {
	return (Object.keys(PRODUCT_KIND_LABEL) as ProductKind[]).map((kind) => (
		<DotBadge
			key={kind}
			label={PRODUCT_KIND_LABEL[kind]}
			icon={PRODUCT_KIND_ICON[kind]}
			tone={PRODUCT_KIND_TONE[kind]}
		/>
	));
}

export function contractTypeBadgeSamples(): ReactNode[] {
	return (Object.keys(CONTRACT_TYPE_LABEL) as ContractType[]).map((type) => (
		<DotBadge
			key={type}
			label={CONTRACT_TYPE_LABEL[type]}
			icon={CONTRACT_TYPE_ICON[type]}
			tone={CONTRACT_TYPE_TONE[type]}
		/>
	));
}

export function paymentTypeBadgeSamples(): ReactNode[] {
	return (Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[]).map((type) => (
		<DotBadge
			key={type}
			label={PAYMENT_TYPE_LABEL[type]}
			icon={PAYMENT_TYPE_ICON[type]}
			tone={PAYMENT_TYPE_TONE[type]}
		/>
	));
}

export function productStatusBadgeSamples(): ReactNode[] {
	return [
		<DomainBadge key="active" label="Attivo" tone="success" icon={ATTR_ICON.approved} />,
		<DomainBadge key="archived" label="Archiviato" tone="muted" icon={Archive} />,
	];
}

/** Placeholder Prodotto senza specializzazione: più largo dei badge tipo. */
export function missingKindBadgeSample(): ReactNode {
	return <DomainBadge label="Configurazione mancante" tone="warning" />;
}

export function inProgressBadgeSample(): ReactNode {
	return <DomainBadge label="In corso" tone="info" icon={ATTR_ICON.inProgress} />;
}

export function remainingEntrancesBadgeSamples(): ReactNode[] {
	return [
		<DomainBadge
			key="not-applicable"
			label="Non applicabile"
			tone="muted"
			icon={ATTR_ICON.remainingEmpty}
		/>,
		<DomainBadge
			key="exhausted"
			label="Esaurito"
			tone="destructive"
			icon={ATTR_ICON.remainingExhausted}
		/>,
		<DomainBadge
			key="remaining"
			label="000 rimanenti"
			tone="success"
			icon={ENTITY_ICON.entrance}
		/>,
	];
}

/** Codice fiscale: 16 caratteri mono, lunghezza fissa a prescindere dall'header. */
export function taxCodeSample({ compact = true }: { compact?: boolean } = {}): ReactNode {
	return <TableCode value="MMMMMM00M00M000M" compact={compact} />;
}
