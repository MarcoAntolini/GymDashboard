"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
	createEntrance,
	deleteEntrance,
	editEntrance,
	getAllEntrances,
	getDailyEntrances,
	getMonthlyEntrances,
	getWeeklyEntrances
} from "@/data-access/entrances";
import { useEntityData } from "@/hooks/useEntityData";
import { cn } from "@/lib/utils";
import { Entrance } from "@prisma/client";
import { format } from "date-fns";
import { BarChart as BarChartIcon, CalendarDays, CalendarIcon, Clock, PlusCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { columns, formSchema } from "./columns";

const analyticsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date()
	})
});

export default function EntrancesPage() {
	const {
		data: entrances,
		setData: setEntrances,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Entrance, "clientId" | "date">(
		useMemo(
			() => ({
				getAll: getAllEntrances,
				deleteAction: deleteEntrance,
				editAction: editEntrance
			}),
			[]
		),
		["clientId", "date"]
	);

	const [isWeeklySheetOpen, setIsWeeklySheetOpen] = useState(false);
	const [isDailySheetOpen, setIsDailySheetOpen] = useState(false);
	const [isMonthlySheetOpen, setIsMonthlySheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
	const [dailyData, setDailyData] = useState<{ hourOfDay: string; totalEntrances: number }[]>([]);
	const [weeklyData, setWeeklyData] = useState<{ dayOfWeek: string; totalEntrances: number }[]>([]);
	const [monthlyData, setMonthlyData] = useState<{ month: string; totalEntrances: number }[]>([]);

	const handleCreateEntrance = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newEntrance = await createEntrance(values);
			setEntrances((prevEntrances) => [...prevEntrances, newEntrance]);
		},
		[setEntrances]
	);

	const handleAnalytics = useCallback(
		async (values: z.infer<typeof analyticsFormSchema>, type: "weekly" | "daily" | "monthly") => {
			setSelectedDateRange(values.date);

			switch (type) {
				case "weekly":
					const weeklyStats = await getWeeklyEntrances(values.date.from, values.date.to);
					setWeeklyData(weeklyStats);
					setIsWeeklySheetOpen(true);
					break;
				case "daily":
					const dailyStats = await getDailyEntrances(values.date.from, values.date.to);
					setDailyData(dailyStats);
					setIsDailySheetOpen(true);
					break;
				case "monthly":
					const monthlyStats = await getMonthlyEntrances(values.date.from, values.date.to);
					setMonthlyData(monthlyStats);
					setIsMonthlySheetOpen(true);
					break;
			}
		},
		[]
	);

	const analyticsFormData: FormData<typeof analyticsFormSchema> = {
		formSchema: analyticsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date()
			}
		},
		submitAction: (values) => handleAnalytics(values, "weekly")
	};

	const actions: Action[] = [
		{
			title: "Add Entrance",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="clientId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Client ID</FormLabel>
								<FormControl>
									<Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date</FormLabel>
								<DateTimePicker field={field} onChange={(date) => field.onChange(date)} />
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					clientId: 0,
					date: new Date()
				},
				submitAction: handleCreateEntrance
			}
		},
		{
			title: "Daily Analysis",
			icon: Clock,
			dialogContent: (
				<DateRangePickerField onSubmit={(values) => handleAnalytics(values, "daily")} formData={analyticsFormData} />
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "daily")
			}
		},
		{
			title: "Weekly Analysis",
			icon: CalendarDays,
			dialogContent: (
				<DateRangePickerField onSubmit={(values) => handleAnalytics(values, "weekly")} formData={analyticsFormData} />
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "weekly")
			}
		},
		{
			title: "Monthly Analysis",
			icon: BarChartIcon,
			dialogContent: (
				<DateRangePickerField onSubmit={(values) => handleAnalytics(values, "monthly")} formData={analyticsFormData} />
			),
			formData: {
				...analyticsFormData,
				submitAction: (values) => handleAnalytics(values, "monthly")
			}
		}
	];

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<>
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEdit)}
						data={entrances}
						filters={["clientId", "date"]}
						facetedFilters={["date"]}
					/>
				}
			/>
			<Sheet open={isDailySheetOpen} onOpenChange={setIsDailySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Daily Entrances Analysis</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Period: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="hourOfDay" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
			<Sheet open={isWeeklySheetOpen} onOpenChange={setIsWeeklySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Weekly Entrances Analysis</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Period: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={weeklyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="dayOfWeek" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
			<Sheet open={isMonthlySheetOpen} onOpenChange={setIsMonthlySheetOpen}>
				<SheetContent side="bottom" className="h-[450px]">
					<SheetHeader>
						<SheetTitle>Monthly Entrances Analysis</SheetTitle>
						<SheetDescription>
							{selectedDateRange &&
								`Period: ${format(selectedDateRange.from, "PP")} - ${format(selectedDateRange.to, "PP")}`}
						</SheetDescription>
					</SheetHeader>
					<div className="h-[350px] mt-4">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={monthlyData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="totalEntrances" fill="#3b82f6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

function DateRangePickerField({
	onSubmit,
	formData
}: {
	onSubmit: (values: z.infer<typeof analyticsFormSchema>) => void;
	formData: FormData<typeof analyticsFormSchema>;
}) {
	return (
		<FormField
			name="date"
			render={({ field }) => (
				<FormItem className="w-full flex flex-col gap-2">
					<FormLabel>Select Period</FormLabel>
					<Popover>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant={"outline"}
									className={cn(
										"w-[300px] justify-start text-left font-normal",
										!field.value && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{field.value?.from ? (
										field.value.to ? (
											<>
												{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
											</>
										) : (
											format(field.value.from, "LLL dd, y")
										)
									) : (
										<span>Pick a date range</span>
									)}
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								initialFocus
								mode="range"
								defaultMonth={field.value?.from}
								selected={field.value}
								onSelect={field.onChange}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
