"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	ChevronsUpDown,
	Pin,
	PinOff,
	type LucideIcon,
} from "lucide-react";
import * as React from "react";
import { LOCKED_COLUMN_IDS } from "./table-column-layout";
import { useColumnLayout } from "./table-column-layout-context";

interface TableSortableHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
	/** Lucide muted a sinistra del titolo (anche colonne non-sortable). */
	icon?: LucideIcon;
	/** Allinea header a destra (colonne numeriche). */
	align?: "left" | "right";
}

/** Padding orizzontale di `TableHead` (`px-4`). */
const TABLE_HEAD_PAD_X = 16;

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
		hasTrigger: boolean;
		pinned: false | "left" | "right";
		sorted: false | "asc" | "desc";
		align: "left" | "right";
	}
) {
	const columnLayout = useColumnLayout();
	const ensureHeaderMinSize = columnLayout?.ensureHeaderMinSize;

	React.useLayoutEffect(() => {
		if (!ensureHeaderMinSize || LOCKED_COLUMN_IDS.has(columnId)) return;
		const el = ref.current;
		if (!el) return;

		// scrollWidth = larghezza intrinseca (non dipende da allineamento in th larghi).
		// Th `px-4`; il trigger ghost usa -ml-3/-mr-3 (12px) dentro quel padding.
		const trigger = el.querySelector("button");
		const negativeInset = trigger ? 12 : 0;
		const contentWidth = Math.ceil((trigger ?? el).scrollWidth);
		const needed = contentWidth + TABLE_HEAD_PAD_X * 2 - negativeInset;
		if (needed > 0) ensureHeaderMinSize(columnId, needed);
	}, [
		columnId,
		ref,
		ensureHeaderMinSize,
		opts.title,
		opts.hasIcon,
		opts.hasTrigger,
		opts.pinned,
		opts.sorted,
		opts.align,
	]);
}

export function TableSortableHeader<TData, TValue>({
	column,
	title,
	icon,
	align = "left",
	className,
}: TableSortableHeaderProps<TData, TValue>) {
	const columnLayout = useColumnLayout();
	const rootRef = React.useRef<HTMLDivElement>(null);
	const alignClass =
		align === "right" ? "w-full justify-end" : "w-max max-w-none justify-start";
	const canSort = column.getCanSort();
	const canPin = column.getCanPin();
	const canReorder = !!columnLayout && !LOCKED_COLUMN_IDS.has(column.id);
	const pinned = column.getIsPinned();
	const sorted = column.getIsSorted();

	const hasLayoutActions = canPin || canReorder;

	useReportHeaderMinSize(column.id, rootRef, {
		title,
		hasIcon: !!icon,
		hasTrigger: canSort || hasLayoutActions,
		pinned,
		sorted,
		align,
	});

	if (!canSort && !hasLayoutActions) {
		return (
			<div
				ref={rootRef}
				className={cn(
					"flex h-8 shrink-0 items-center px-0 text-sm font-medium whitespace-nowrap",
					alignClass,
					className
				)}
			>
				<HeaderIcon icon={icon} />
				<span className="whitespace-nowrap">{title}</span>
			</div>
		);
	}

	return (
		<div
			ref={rootRef}
			className={cn(
				"flex shrink-0 items-center gap-2 whitespace-nowrap",
				alignClass,
				className
			)}
		>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"h-8 shrink-0 data-[state=open]:bg-accent",
							align === "right" ? "-mr-3 ml-auto" : "-ml-3"
						)}
						aria-label={`Opzioni colonna ${title}`}
					>
						<HeaderIcon icon={icon} />
						<span className="whitespace-nowrap">{title}</span>
						{pinned ? (
							<Pin className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
						) : null}
						{canSort ? (
							sorted === "desc" ? (
								<ArrowDownIcon className="ml-2 h-4 w-4 shrink-0" />
							) : sorted === "asc" ? (
								<ArrowUpIcon className="ml-2 h-4 w-4 shrink-0" />
							) : (
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
							)
						) : null}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align={align === "right" ? "end" : "start"}>
					{canSort ? (
						<>
							<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
								<ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Asc
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
								<ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Desc
							</DropdownMenuItem>
						</>
					) : null}
					{canSort && hasLayoutActions ? <DropdownMenuSeparator /> : null}
					{canReorder ? (
						<>
							<DropdownMenuItem
								onClick={() => columnLayout.moveColumn(column.id, -1)}
							>
								<ArrowLeftIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Sposta a sinistra
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => columnLayout.moveColumn(column.id, 1)}
							>
								<ArrowRightIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Sposta a destra
							</DropdownMenuItem>
						</>
					) : null}
					{canReorder && canPin ? <DropdownMenuSeparator /> : null}
					{canPin ? (
						<>
							{pinned !== "left" ? (
								<DropdownMenuItem onClick={() => column.pin("left")}>
									<Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Fissa a sinistra
								</DropdownMenuItem>
							) : null}
							{pinned !== "right" ? (
								<DropdownMenuItem onClick={() => column.pin("right")}>
									<Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Fissa a destra
								</DropdownMenuItem>
							) : null}
							{pinned ? (
								<DropdownMenuItem onClick={() => column.pin(false)}>
									<PinOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Sblocca colonna
								</DropdownMenuItem>
							) : null}
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
