"use client";

import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, type LucideIcon } from "lucide-react";
import * as React from "react";
import { LOCKED_COLUMN_IDS, TABLE_CELL_PAD_X } from "./table-column-layout";
import { useColumnLayout } from "./table-column-layout-context";

interface TableSortableHeaderProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	/** Lucide muted a sinistra del titolo (anche colonne non-sortable). */
	icon?: LucideIcon;
	className?: string;
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
		hasIcon: !!icon || canSort,
		sorted,
	});

	const sortIcon = !canSort ? null : sorted === "desc" ? (
		<ArrowDownIcon aria-hidden className="ml-2 h-4 w-4 shrink-0" />
	) : sorted === "asc" ? (
		<ArrowUpIcon aria-hidden className="ml-2 h-4 w-4 shrink-0" />
	) : (
		<ArrowUpDownIcon
			aria-hidden
			className="ml-2 h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100"
		/>
	);

	const chrome = (
		<>
			<HeaderIcon icon={icon} />
			<span className="whitespace-nowrap">{title}</span>
			{sortIcon}
		</>
	);

	return (
		<div
			ref={rootRef}
			className={cn(
				"flex h-8 w-max max-w-none shrink-0 items-center justify-start px-0 text-sm font-medium whitespace-nowrap",
				className
			)}
		>
			{canSort ? (
				<button
					type="button"
					className="group inline-flex h-8 cursor-pointer items-center rounded-sm bg-transparent p-0 font-medium text-inherit whitespace-nowrap hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					onClick={() => column.toggleSorting()}
					aria-label={`Ordina per ${title}`}
				>
					{chrome}
				</button>
			) : (
				chrome
			)}
		</div>
	);
}
