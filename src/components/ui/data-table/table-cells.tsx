"use client";

import { HighlightText } from "@/components/ui/highlight-text";
import { formatPersonName } from "@/lib/domain/labels";
import { formatDateIt, formatTimeIt } from "@/lib/format";
import { cn } from "@/lib/utils";

const META = "tabular-nums text-muted-foreground";

function isoDate(value: Date | string | number): string {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Chiave numerica (ID riga, FK). Meta, non identità. Colonna: allineata a destra. */
export function TableId({
	value,
	pad,
	prefix,
	filterKeys,
	className,
	align = "right",
}: {
	value: number | string;
	pad?: number;
	prefix?: string;
	filterKeys?: string | string[];
	className?: string;
	/** `left` per ID in linea (es. accanto al nome). */
	align?: "left" | "right";
}) {
	const digits = pad != null ? String(value).padStart(pad, "0") : String(value);
	const text = prefix ? `${prefix}${digits}` : digits;
	const classes = cn(
		META,
		"whitespace-nowrap",
		align === "right" && "block w-full text-right",
		className
	);
	if (filterKeys) {
		return (
			<HighlightText
				text={text}
				filterKeys={filterKeys}
				className={classes}
				as={align === "right" ? "div" : "span"}
			/>
		);
	}
	const Comp = align === "right" ? "div" : "span";
	return <Comp className={classes}>{text}</Comp>;
}

/** Codice fiscale / codice prodotto. Mono + muted. CF: `compact`. */
export function TableCode({
	value,
	filterKeys,
	className,
	compact,
}: {
	value: string;
	filterKeys?: string | string[];
	className?: string;
	compact?: boolean;
}) {
	const classes = cn(
		META,
		"font-mono tracking-tight whitespace-nowrap",
		compact ? "text-[0.8125rem]" : "text-sm",
		className
	);
	if (filterKeys) {
		return (
			<HighlightText
				text={value}
				filterKeys={filterKeys}
				className={classes}
			/>
		);
	}
	return <span className={classes}>{value}</span>;
}

/** Data-only: stesso `formatDateIt`, peso da metadato. */
export function TableDate({
	value,
	className,
}: {
	value: Date | string | number;
	className?: string;
}) {
	return (
		<time dateTime={isoDate(value)} className={cn(META, "whitespace-nowrap", className)}>
			{formatDateIt(value)}
		</time>
	);
}

/** Data muted + ora in evidenza (Timbrature, Ingressi, Interventi). */
export function TableDateTime({
	value,
	className,
}: {
	value: Date | string | number;
	className?: string;
}) {
	return (
		<time
			dateTime={isoDate(value)}
			className={cn("flex min-w-0 flex-col justify-center leading-tight", className)}
		>
			<span className={cn(META, "text-xs")}>{formatDateIt(value)}</span>
			<span className="tabular-nums text-foreground">{formatTimeIt(value)}</span>
		</time>
	);
}

export function TablePerson({
	person,
	nameFilterKeys,
	idFilterKeys,
	className,
}: {
	person: { name: string; surname: string; id?: number } | null | undefined;
	nameFilterKeys?: string | string[];
	idFilterKeys?: string | string[];
	className?: string;
}) {
	if (!person) {
		return <span className="text-muted-foreground">—</span>;
	}
	const name = formatPersonName(person);
	return (
		<span className={cn("inline-flex min-w-0 max-w-full items-baseline gap-1.5", className)}>
			{nameFilterKeys ? (
				<HighlightText text={name} filterKeys={nameFilterKeys} className="min-w-0 truncate" />
			) : (
				<span className="min-w-0 truncate">{name}</span>
			)}
			{person.id != null ? (
				<TableId
					value={person.id}
					prefix="#"
					filterKeys={idFilterKeys}
					align="left"
					className="shrink-0"
				/>
			) : null}
		</span>
	);
}
