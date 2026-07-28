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

function HeaderIcon({ icon: Icon }: { icon?: LucideIcon }) {
	if (!Icon) return null;
	return <Icon aria-hidden className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function TableSortableHeader<TData, TValue>({
	column,
	title,
	icon,
	align = "left",
	className,
}: TableSortableHeaderProps<TData, TValue>) {
	const columnLayout = useColumnLayout();
	const alignClass = align === "right" ? "justify-end" : "justify-start";
	const canSort = column.getCanSort();
	const canPin = column.getCanPin();
	const canReorder = !!columnLayout && !LOCKED_COLUMN_IDS.has(column.id);
	const pinned = column.getIsPinned();

	const hasLayoutActions = canPin || canReorder;
	if (!canSort && !hasLayoutActions) {
		return (
			<div
				className={cn(
					"flex h-8 items-center px-0 text-sm font-medium",
					alignClass,
					className
				)}
			>
				<HeaderIcon icon={icon} />
				<span>{title}</span>
			</div>
		);
	}

	return (
		<div className={cn("flex items-center gap-2", alignClass, className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"h-8 data-[state=open]:bg-accent",
							align === "right" ? "-mr-3 ml-auto" : "-ml-3"
						)}
						aria-label={`Opzioni colonna ${title}`}
					>
						<HeaderIcon icon={icon} />
						<span>{title}</span>
						{pinned ? (
							<Pin className="ml-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
						) : null}
						{canSort ? (
							column.getIsSorted() === "desc" ? (
								<ArrowDownIcon className="ml-2 h-4 w-4" />
							) : column.getIsSorted() === "asc" ? (
								<ArrowUpIcon className="ml-2 h-4 w-4" />
							) : (
								<ChevronsUpDown className="ml-2 h-4 w-4" />
							)
						) : (
							<ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/70" />
						)}
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
