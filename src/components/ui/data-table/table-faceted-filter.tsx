import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import { Check, Filter } from "lucide-react";

export type FacetedFilterOption = {
	label: string;
	value: string;
};

interface TableFacetedFilterProps<TData, TValue> {
	column?: Column<TData, TValue>;
	title?: string;
	options: FacetedFilterOption[];
	/** Controlled (server-list draft). Se assente → legge/scrive sulla column. */
	value?: string[];
	onValueChange?: (value: string[] | undefined) => void;
}

export function TableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
	value,
	onValueChange,
}: TableFacetedFilterProps<TData, TValue>) {
	const facets = column?.getFacetedUniqueValues() as Map<string, number> | undefined;
	const selectedValues = new Set(
		value ?? ((column?.getFilterValue() as string[] | undefined) ?? [])
	);

	const commit = (next: string[] | undefined) => {
		if (onValueChange) {
			onValueChange(next?.length ? next : undefined);
			return;
		}
		column?.setFilterValue(next?.length ? next : undefined);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-10 border-dashed"
				>
					<Filter className="mr-2 h-4 w-4" />
					{title}
					{selectedValues.size > 0 && (
						<>
							<Separator
								orientation="vertical"
								className="mx-2 h-4"
							/>
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal lg:hidden"
							>
								{selectedValues.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal"
									>
										{selectedValues.size} selezionati
									</Badge>
								) : (
									options
										.filter((option) => selectedValues.has(option.value))
										.map((option) => (
											<Badge
												variant="secondary"
												key={option.value}
												className="rounded-sm px-1 font-normal"
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[200px] p-0"
				align="start"
			>
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>Nessun risultato.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											const next = new Set(selectedValues);
											if (isSelected) {
												next.delete(option.value);
											} else {
												next.add(option.value);
											}
											const filterValues = Array.from(next);
											commit(filterValues.length ? filterValues : undefined);
										}}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<span>{option.label}</span>
										{facets?.get(option.value) ? (
											<span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
												{facets.get(option.value)}
											</span>
										) : null}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => commit(undefined)}
										className="justify-center text-center"
									>
										Cancella filtri
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
