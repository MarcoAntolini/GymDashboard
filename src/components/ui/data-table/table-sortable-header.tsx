"use client";

import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, type LucideIcon } from "lucide-react";
import * as React from "react";
import { LOCKED_COLUMN_IDS, TABLE_CELL_PAD_X } from "./table-column-layout";
import { useColumnLayout } from "./table-column-layout-context";

interface TableSortableHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
	/** Lucide muted a sinistra del titolo (anche colonne non-sortable). */
	icon?: LucideIcon;
}

function HeaderIcon({ icon: Icon }: { icon?: LucideIcon }) {
	if (!Icon) return null;
	return <Icon aria-hidden className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

/** Misura titolo+chrome e aggiorna il min-width colonna (padding th incluso). */
function useReportHeaderMinSize(
	columnId: string,
	ref: React.RefObject<HTMLElement | null>,
	opts: {
		title: string;
		hasIcon: boolean;
		sorted: false | "asc" | "desc";
	}
) {
	const columnLayout = useColumnLayout();
	const setColumnMinSize = columnLayout?.setColumnMinSize;
	const fontsReady = columnLayout?.fontsReady;

	React.useLayoutEffect(() => {
		if (!setColumnMinSize || LOCKED_COLUMN_IDS.has(columnId)) return;
		const el = ref.current;
		if (!el) return;

		const contentWidth = Math.ceil(el.scrollWidth);
		const needed = contentWidth + TABLE_CELL_PAD_X * 2;
		if (needed > 0) setColumnMinSize("header", columnId, needed);
	}, [
		columnId,
		ref,
		setColumnMinSize,
		fontsReady,
		opts.title,
		opts.hasIcon,
		opts.sorted,
	]);
}

export function TableSortableHeader<TData, TValue>({
	column,
	title,
	icon,
	className,
}: TableSortableHeaderProps<TData, TValue>) {
	const rootRef = React.useRef<HTMLDivElement>(null);
	const canSort = column.getCanSort();
	const sorted = column.getIsSorted();

	useReportHeaderMinSize(column.id, rootRef, {
		title,
		hasIcon: !!icon,
		sorted,
	});

	return (
		<div
			ref={rootRef}
			className={cn(
				"flex h-8 w-max max-w-none shrink-0 items-center justify-start px-0 text-sm font-medium whitespace-nowrap",
				className
			)}
		>
			<HeaderIcon icon={icon} />
			<span className="whitespace-nowrap">{title}</span>
			{canSort && sorted === "desc" ? (
				<ArrowDownIcon aria-hidden className="ml-2 h-4 w-4 shrink-0" />
			) : canSort && sorted === "asc" ? (
				<ArrowUpIcon aria-hidden className="ml-2 h-4 w-4 shrink-0" />
			) : null}
		</div>
	);
}
