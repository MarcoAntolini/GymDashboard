import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

export default function TablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
	const pageCount = Math.max(table.getPageCount(), 1);

	return (
		<div className="flex flex-col gap-3 px-2 pt-4 sm:flex-row sm:items-center sm:justify-end">
			<div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6 lg:gap-8">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium whitespace-nowrap">Righe per pagina</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							<SelectGroup>
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[110px] items-center justify-center text-sm font-medium tabular-nums">
					Pag. {table.getState().pagination.pageIndex + 1} / {pageCount}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Prima pagina</span>
						<ChevronsLeftIcon className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Pagina precedente</span>
						<ChevronLeftIcon className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Pagina successiva</span>
						<ChevronRightIcon className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Ultima pagina</span>
						<ChevronsRightIcon className="size-4" aria-hidden />
					</Button>
				</div>
			</div>
		</div>
	);
}
