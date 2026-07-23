"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractType, PaymentType, PurchaseType, Role } from "@prisma/client";
import { CheckCircle2, Clock3, XCircle, type LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = NonNullable<BadgeProps["variant"]>;

const swatchClass: Record<Tone, string> = {
	default: "bg-primary",
	brand: "bg-primary",
	secondary: "bg-muted-foreground",
	destructive: "bg-destructive",
	success: "bg-success",
	warning: "bg-warning",
	info: "bg-info",
	outline: "bg-foreground"
};

type DotBadgeProps = {
	label: string;
	tone?: Tone;
	shape?: "square" | "circle";
	className?: string;
	title?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/** Category chip: outline + colored swatch (enums / kinds). */
export function DotBadge({
	label,
	tone = "secondary",
	shape = "square",
	className,
	title,
	...props
}: DotBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"pointer-events-none max-w-full gap-1.5 border-border/80 bg-muted/40 font-medium text-foreground",
				className
			)}
			title={title ?? label}
			{...props}
		>
			<span
				className={cn(
					"size-2 shrink-0",
					shape === "circle" ? "rounded-full" : "rounded-[2px]",
					swatchClass[tone]
				)}
				aria-hidden
			/>
			<span className="truncate">{label}</span>
		</Badge>
	);
}

type DomainBadgeProps = {
	label: string;
	tone?: Tone;
	icon?: LucideIcon;
	className?: string;
	title?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/** Status chip: tinted fill + optional icon. */
export function DomainBadge({
	label,
	tone = "secondary",
	icon: Icon,
	className,
	title,
	...props
}: DomainBadgeProps) {
	return (
		<Badge
			variant={tone}
			className={cn("pointer-events-none max-w-full truncate", className)}
			title={title ?? label}
			{...props}
		>
			{Icon ? <Icon aria-hidden /> : null}
			<span className="truncate">{label}</span>
		</Badge>
	);
}

// Prefer string keys over Prisma runtime enums in client components.
export const paymentTypeLabel: Record<PaymentType, string> = {
	Salary: "Stipendio",
	Bill: "Bolletta",
	Equipment: "Attrezzatura",
	Intervention: "Intervento"
};

const paymentTypeMeta: Record<PaymentType, { tone: Tone }> = {
	Salary: { tone: "secondary" },
	Bill: { tone: "warning" },
	Equipment: { tone: "info" },
	Intervention: { tone: "destructive" }
};

export function PaymentTypeBadge({ type }: { type: PaymentType }) {
	return <DotBadge label={paymentTypeLabel[type]} tone={paymentTypeMeta[type].tone} />;
}

export const purchaseTypes = ["Membership", "EntranceSet"] as const satisfies readonly PurchaseType[];

export const purchaseTypeLabel: Record<PurchaseType, string> = {
	Membership: "Abbonamento",
	EntranceSet: "Pacchetto"
};

const purchaseTypeMeta: Record<PurchaseType, { tone: Tone }> = {
	Membership: { tone: "brand" },
	EntranceSet: { tone: "info" }
};

export function PurchaseTypeBadge({ type }: { type: PurchaseType }) {
	return <DotBadge label={purchaseTypeLabel[type]} tone={purchaseTypeMeta[type].tone} />;
}

export type ProductKindKey = "Membership" | "EntranceSet";

const productKindMeta: Record<ProductKindKey, { label: string; tone: Tone }> = {
	Membership: { label: "Abbonamento", tone: "brand" },
	EntranceSet: { label: "Pacchetto", tone: "info" }
};

export function ProductKindBadge({
	kind,
	label
}: {
	kind: ProductKindKey | null;
	/** Override label (e.g. "Pacchetto ingressi" on Products). */
	label?: string;
}) {
	if (!kind) {
		return <span className="text-muted-foreground">—</span>;
	}
	const meta = productKindMeta[kind];
	return <DotBadge label={label ?? meta.label} tone={meta.tone} />;
}

export const contractTypeLabel: Record<ContractType, string> = {
	FixedTerm: "Tempo determinato",
	OpenEnded: "Tempo indeterminato"
};

export function ContractTypeBadge({ type }: { type: ContractType }) {
	return (
		<DotBadge
			label={contractTypeLabel[type]}
			tone={type === "OpenEnded" ? "success" : "warning"}
		/>
	);
}

export function ApprovalBadge({ approved }: { approved: boolean }) {
	return approved ? (
		<DomainBadge label="Approvato" tone="success" icon={CheckCircle2} />
	) : (
		<DomainBadge label="In attesa" tone="warning" icon={Clock3} />
	);
}

export function RoleBadge({ role }: { role: Role }) {
	return role === "Admin" ? (
		<DotBadge label="Amministratore" tone="brand" />
	) : (
		<DotBadge label="Dipendente" tone="secondary" />
	);
}

/** Residuo Pacchetto: status-style (full tint) — esaurito / basso / ok. */
export function RemainingEntrancesBadge({
	remaining,
	total
}: {
	remaining: number;
	total?: number | null;
}) {
	const tone: Tone = remaining <= 0 ? "destructive" : remaining <= 2 ? "warning" : "success";
	const Icon = remaining <= 0 ? XCircle : remaining <= 2 ? Clock3 : CheckCircle2;
	const label = total != null ? `${remaining} / ${total}` : String(remaining);
	const title =
		remaining <= 0
			? "Pacchetto esaurito"
			: remaining <= 2
				? "Pochi ingressi rimanenti"
				: "Ingressi rimanenti sul Pacchetto";

	return (
		<DomainBadge label={label} tone={tone} icon={Icon} title={title} className="tabular-nums" />
	);
}

export function MoneyTone({
	amount,
	direction,
	children,
	className
}: {
	amount: number;
	/** income = entrate; expense = uscite; balance = signed saldo */
	direction: "income" | "expense" | "balance";
	children: ReactNode;
	className?: string;
}) {
	const toneClass =
		direction === "income"
			? "text-success"
			: direction === "expense"
				? "text-destructive"
				: amount < 0
					? "text-destructive"
					: amount > 0
						? "text-success"
						: "text-foreground";

	return <span className={cn("tabular-nums", toneClass, className)}>{children}</span>;
}
