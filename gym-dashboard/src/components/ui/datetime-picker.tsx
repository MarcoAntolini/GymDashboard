"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export function DateTimePicker(props: { field: any; onChange: (date: Date) => void; disabled?: boolean }) {
	const { field, onChange, disabled } = props;

	function handleDateSelect(date: Date | undefined) {
		if (date) {
			onChange(date);
		}
	}

	function handleTimeChange(type: "hour" | "minute", value: string) {
		const currentDate = field.value || new Date();
		let newDate = new Date(currentDate);

		if (type === "hour") {
			const hour = parseInt(value, 10);
			newDate.setHours(hour);
		} else if (type === "minute") {
			newDate.setMinutes(parseInt(value, 10));
		}

		onChange(newDate);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<FormControl>
					<Button
						variant={"outline"}
						className={cn(
							"w-full pl-3 text-left font-normal",
							!field.value && "text-muted-foreground",
							disabled === true && "!cursor-not-allowed"
						)}
						disabled={disabled}
					>
						{field.value ? format(field.value, "MM/dd/yyyy HH:mm") : <span>MM/DD/YYYY HH:mm</span>}
						<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
					</Button>
				</FormControl>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<div className="sm:flex">
					<Calendar mode="single" selected={field.value} onSelect={handleDateSelect} initialFocus />
					<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{Array.from({ length: 24 }, (_, i) => i)
									.reverse()
									.map((hour) => (
										<Button
											key={hour}
											size="icon"
											variant={field.value && field.value.getHours() === hour ? "default" : "ghost"}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() => handleTimeChange("hour", hour.toString())}
										>
											{hour}
										</Button>
									))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="icon"
										variant={field.value && field.value.getMinutes() === minute ? "default" : "ghost"}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() => handleTimeChange("minute", minute.toString())}
									>
										{minute.toString().padStart(2, "0")}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
