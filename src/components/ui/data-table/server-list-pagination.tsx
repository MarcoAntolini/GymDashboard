"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/domain/list-query";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react";

export type ServerListPaginationProps = {
	page: number;
	pageSize: number;
	pageCount: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	pageSizeOptions?: readonly number[];
};

/**
 * Server-side pagination controls (ticket 19).
 *
 * Driven by {@link ListQueryResult} totals — not by client-filtered row models.
 * Page changes must trigger a new data-access query (LIMIT/OFFSET).
 */
export function ServerListPagination({
	page,
	pageSize,
	pageCount,
	total,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = PAGE_SIZE_OPTIONS,
}: ServerListPaginationProps) {
	const canPrevious = page > 1;
	const canNext = pageCount > 0 && page < pageCount;

	return (
		<div className="flex items-center justify-end px-2 pt-4">
			<div className="flex items-center space-x-6 lg:space-x-8">
				<p className="hidden text-sm text-muted-foreground sm:block">
					{total === 0 ? "Nessun risultato" : `${total} totali`}
				</p>
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Righe per pagina</p>
					<Select
						value={`${pageSize}`}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={`${size}`}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Pagina {pageCount === 0 ? 0 : page} di {pageCount}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(1)}
						disabled={!canPrevious}
					>
						<span className="sr-only">Prima pagina</span>
						<ChevronsLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(page - 1)}
						disabled={!canPrevious}
					>
						<span className="sr-only">Pagina precedente</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(page + 1)}
						disabled={!canNext}
					>
						<span className="sr-only">Pagina successiva</span>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(pageCount)}
						disabled={!canNext}
					>
						<span className="sr-only">Ultima pagina</span>
						<ChevronsRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
