"use client";

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
import { useDataTableUi } from "./data-table-ui-context";

interface TableSortableHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
	/** Small muted icon left of the title (column recognition). */
	icon?: LucideIcon;
}

/**
 * Shared chrome for every column header (sortable or not):
 * same height, type size, icon size, padding, baseline.
 */
const headerShellClass = cn(
	"-ml-3 inline-flex h-8 items-center justify-start gap-1.5 rounded-md px-3",
	"text-sm font-medium leading-none text-muted-foreground",
	"[&_svg]:size-3.5 [&_svg]:shrink-0"
);

function HeaderLabel({ title, icon: Icon }: { title: string; icon?: LucideIcon }) {
	return (
		<>
			{Icon ? <Icon className="text-muted-foreground" aria-hidden strokeWidth={2} /> : null}
			<span className="whitespace-nowrap">{title}</span>
		</>
	);
}

export function TableSortableHeader<TData, TValue>({
	column,
	title,
	icon,
	className,
}: TableSortableHeaderProps<TData, TValue>) {
	const tableUi = useDataTableUi();
	const label = <HeaderLabel title={title} icon={icon} />;
	const canSort = column.getCanSort();
	const canPin = column.getCanPin();
	const pinned = column.getIsPinned();
	const sortState = column.getIsSorted();
	const showMenu = canSort || canPin || tableUi != null;

	if (!showMenu) {
		return <div className={cn(headerShellClass, className)}>{label}</div>;
	}

	return (
		<div className={cn("flex min-w-0 items-center", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className={cn(
							headerShellClass,
							"cursor-pointer transition-colors hover:bg-accent hover:text-foreground",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							"data-[state=open]:bg-accent"
						)}
					>
						{label}
						{pinned ? <Pin className="opacity-70" aria-hidden /> : null}
						{canSort ? (
							sortState === "desc" ? (
								<ArrowDownIcon className="opacity-70" aria-hidden />
							) : sortState === "asc" ? (
								<ArrowUpIcon className="opacity-70" aria-hidden />
							) : (
								<ChevronsUpDown className="opacity-50" aria-hidden />
							)
						) : null}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{canSort ? (
						<>
							<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
								<ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Crescente
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
								<ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Decrescente
							</DropdownMenuItem>
							{(canPin || tableUi) && <DropdownMenuSeparator />}
						</>
					) : null}
					{tableUi ? (
						<>
							<DropdownMenuItem onClick={() => tableUi.moveColumn(column.id, -1)}>
								<ArrowLeftIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Sposta a sinistra
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => tableUi.moveColumn(column.id, 1)}>
								<ArrowRightIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Sposta a destra
							</DropdownMenuItem>
							{canPin ? <DropdownMenuSeparator /> : null}
						</>
					) : null}
					{canPin ? (
						<>
							<DropdownMenuItem
								disabled={pinned === "left"}
								onClick={() => column.pin("left")}
							>
								<Pin className="mr-2 size-3.5 text-muted-foreground/70" />
								Fissa a sinistra
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={pinned === "right"}
								onClick={() => column.pin("right")}
							>
								<Pin className="mr-2 size-3.5 text-muted-foreground/70" />
								Fissa a destra
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={!pinned}
								onClick={() => column.pin(false)}
							>
								<PinOff className="mr-2 size-3.5 text-muted-foreground/70" />
								Sblocca colonna
							</DropdownMenuItem>
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
