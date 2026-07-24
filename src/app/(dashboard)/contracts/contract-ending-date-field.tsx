"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { contractRequiresEndingDate } from "@/lib/contract-term";
import { cn } from "@/lib/utils";
import { ContractType } from "@prisma/client";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

type EndingDateFieldProps = {
	/** `calendar` = create dialog (Popover+Calendar); `input` = edit dialog (date input). */
	variant?: "calendar" | "input";
};

/**
 * Mostra/richiede data fine solo per tempo determinato.
 * Su passaggio a indeterminato azzera endingDate.
 */
export function ContractEndingDateField({ variant = "calendar" }: EndingDateFieldProps) {
	const { watch, setValue } = useFormContext();
	const type = watch("type") as ContractType;
	const showEnding = contractRequiresEndingDate(type);

	useEffect(() => {
		if (!showEnding) {
			setValue("endingDate", undefined, { shouldValidate: true });
		}
	}, [showEnding, setValue]);

	if (!showEnding) {
		return null;
	}

	if (variant === "input") {
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
								onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
