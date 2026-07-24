import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronsUpDown,
	type LucideIcon,
} from "lucide-react";

interface TableSortableHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column?: Column<TData, TValue>;
	title: string;
	/** Lucide icon shown muted to the left of the title (DESIGN.md / ticket 41). */
	icon?: LucideIcon;
	/** Numeric columns (non-id): right-align header chrome. */
	align?: "left" | "right";
}

function HeaderChrome({
	title,
	icon: Icon,
	align,
	className,
	trailing,
}: {
	title: string;
	icon?: LucideIcon;
	align?: "left" | "right";
	className?: string;
	trailing?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex h-8 items-center gap-2 text-sm font-medium",
				align === "right" ? "justify-end" : "justify-start",
				className
			)}
		>
			{Icon ? (
				<Icon
					aria-hidden
					className="size-3.5 shrink-0 text-muted-foreground"
				/>
			) : null}
			<span className="truncate">{title}</span>
			{trailing}
		</div>
	);
}

/**
 * Uniform column header chrome (sortable or not): muted icon + title.
 * Non-sortable columns keep the same height/spacing as sortable ones.
 */
export function TableSortableHeader<TData, TValue>({
	column,
	title,
	icon,
	align = "left",
	className,
}: TableSortableHeaderProps<TData, TValue>) {
	const canSort = Boolean(column?.getCanSort());

	if (!canSort || !column) {
		return (
			<HeaderChrome
				title={title}
				icon={icon}
				align={align}
				className={cn(align === "right" ? "w-full" : undefined, className)}
			/>
		);
	}

	const sorted = column.getIsSorted();

	return (
		<div
			className={cn(
				"flex items-center",
				align === "right" ? "justify-end" : "justify-start",
				className
			)}
		>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"h-8 data-[state=open]:bg-accent",
							align === "right" ? "-mr-3 ml-auto" : "-ml-3"
						)}
					>
						<HeaderChrome
							title={title}
							icon={icon}
							trailing={
								sorted === "desc" ? (
									<ArrowDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
								) : sorted === "asc" ? (
									<ArrowUpIcon className="size-3.5 shrink-0 text-muted-foreground" />
								) : (
									<ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
								)
							}
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align={align === "right" ? "end" : "start"}>
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
