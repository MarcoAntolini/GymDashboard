"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateIt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";

type FormDateFieldProps = {
	value?: Date;
	onChange: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	disabledDates?: Matcher | Matcher[];
	defaultMonth?: Date;
	className?: string;
};

/** Trigger data create/edit: stesso chrome Calendar + `formatDateIt` (mese abbreviato IT). */
export function FormDateField({
	value,
	onChange,
	placeholder = "Scegli una data",
	disabled,
	disabledDates,
	defaultMonth,
	className,
}: FormDateFieldProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<FormControl>
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full pl-3 text-left font-normal",
							!value && "text-muted-foreground",
							className
						)}
					>
						{value ? formatDateIt(value) : <span>{placeholder}</span>}
						<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
					</Button>
				</FormControl>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onChange}
					disabled={disabledDates}
					defaultMonth={defaultMonth ?? value}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
