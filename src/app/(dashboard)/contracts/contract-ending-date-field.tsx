"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTRACT_IN_PROGRESS_LABEL, isFixedTermContract } from "@/lib/domain/contract-term";
import { cn } from "@/lib/utils";
import { ContractType } from "@prisma/client";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

type Mode = "calendar" | "input";

/**
 * Shows endingDate only for FixedTerm (determinato).
 * OpenEnded (indeterminato): clears endingDate and shows "In corso".
 */
export function ContractEndingDateField({ mode = "calendar" }: { mode?: Mode }) {
	const { control, setValue } = useFormContext();
	const type = useWatch({ control, name: "type" }) as ContractType | undefined;

	useEffect(() => {
		if (type === ContractType.OpenEnded) {
			setValue("endingDate", undefined, { shouldValidate: true, shouldDirty: true });
		}
	}, [type, setValue]);

	if (!isFixedTermContract(type ?? ContractType.OpenEnded)) {
		return (
			<div className="space-y-2">
				<p className="text-sm font-medium leading-none">Ending Date</p>
				<p className="text-sm text-muted-foreground">{CONTRACT_IN_PROGRESS_LABEL}</p>
			</div>
		);
	}

	if (mode === "input") {
		return (
			<FormField
				name="endingDate"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ending Date</FormLabel>
						<FormControl>
							<Input
								type="date"
								value={
									field.value instanceof Date && !Number.isNaN(field.value.getTime())
										? format(field.value, "yyyy-MM-dd")
										: ""
								}
								onChange={(e) =>
									field.onChange(e.target.value ? new Date(e.target.value) : undefined)
								}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	return (
		<FormField
			name="endingDate"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Ending Date</FormLabel>
					<FormControl>
						<Popover>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant={"outline"}
										className={cn(
											"w-full pl-3 text-left font-normal",
											!field.value && "text-muted-foreground"
										)}
									>
										{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
										<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={field.value}
									onSelect={field.onChange}
									disabled={(date) => date < new Date("1900-01-01")}
									defaultMonth={field.value || new Date()}
								/>
							</PopoverContent>
						</Popover>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
