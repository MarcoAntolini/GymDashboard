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
	const alignClass = align === "right" ? "justify-end" : "justify-start";

	if (!column.getCanSort()) {
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
		<div className={cn("flex items-center space-x-2", alignClass, className)}>
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
						<HeaderIcon icon={icon} />
						<span>{title}</span>
						{column.getIsSorted() === "desc" ? (
							<ArrowDownIcon className="ml-2 h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<ArrowUpIcon className="ml-2 h-4 w-4" />
						) : (
							<ChevronsUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align={align === "right" ? "end" : "start"}>
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
