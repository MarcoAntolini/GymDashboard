"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAccountSafe } from "@/data-access/accounts";
import {
	createContract,
	deleteContract,
	editContract,
	EmployeesEarningsInPeriod,
	getAllContracts,
	getEmployeesEarningsInPeriod
} from "@/data-access/contracts";
import { getEmployeesWithoutContract } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { cn } from "@/lib/utils";
import { Contract, ContractType, Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calculator, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { useCookies } from "next-client-cookies";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

const earningsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date()
	})
});

export default function Contracts() {
	const {
		data: contracts,
		setData: setContracts,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Contract, "employeeId" | "startingDate">(
		useMemo(
			() => ({
				getAll: getAllContracts,
				deleteAction: deleteContract,
				editAction: editContract
			}),
			[]
		),
		["employeeId", "startingDate"]
	);

	const { data: employeesWithoutContract, setData: setEmployeesWithoutContract } = useEntityData<Employee, "id">(
		useMemo(
			() => ({
				getAll: getEmployeesWithoutContract
			}),
			[]
		),
		["id"]
	);

	const cookies = useCookies();

	const handleCreateContract = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newContract = await createContract(values);
			setContracts((prevContracts) => [...prevContracts, newContract]);
			setEmployeesWithoutContract((prevEmployees) =>
				prevEmployees.filter((employee) => employee.id !== values.employeeId)
			);
		},
		[setContracts, setEmployeesWithoutContract]
	);
	const createContractFormData: FormData<typeof formSchema> = {
		formSchema,
		defaultValues: {
			employeeId: 0,
			type: ContractType.FixedTerm,
			hourlyFee: 0,
			startingDate: new Date(),
			endingDate: undefined
		},
		submitAction: handleCreateContract
	};

	const [isEarningsSheetOpen, setIsEarningsSheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
	const handleCalculateEarnings = useCallback(async (values: z.infer<typeof earningsFormSchema>) => {
		const earnings = await getEmployeesEarningsInPeriod({
			startingDate: values.date.from,
			endingDate: values.date.to
		});
		setEarningsData(earnings);
		setSelectedDateRange(values.date);
		setIsEarningsSheetOpen(true);
	}, []);
	const earningsFormData: FormData<typeof earningsFormSchema> = {
		formSchema: earningsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date()
			}
		},
		submitAction: handleCalculateEarnings
	};
	const [earningsData, setEarningsData] = useState<EmployeesEarningsInPeriod[]>([]);

	const [employeeId, setEmployeeId] = useState(0);
	useEffect(() => {
		const accountUsername = cookies.get("session");
		if (accountUsername) {
			getAccountSafe(accountUsername).then((account) => {
				setEmployeeId(account?.employee?.id ?? 0);
			});
		}
	}, [cookies]);

	const actions: Action[] = [
		{
			title: "Add Contract",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutContract.length === 0 ? (
						<div className="text-center text-sm text-muted-foreground">There are no employees without a contract</div>
					) : (
						<>
							<FormField
								name="employeeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Employee</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(parseInt(value, 10))}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select an employee" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													{employeesWithoutContract.map((employee) => (
														<SelectItem key={employee.id} value={employee.id.toString()}>
															{employee.id} - {employee.name} {employee.surname}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Contract Type</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a contract type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={ContractType.FixedTerm}>Fixed Term</SelectItem>
												<SelectItem value={ContractType.OpenEnded}>Open Ended</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="hourlyFee"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hourly Fee</FormLabel>
										<FormControl>
											<Input
												min={0}
												{...field}
												onChange={(e) => {
													if (e.target.value === "" || isNaN(field.value)) {
														field.onChange(0);
													} else {
														field.onChange(parseFloat(e.target.value));
													}
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="startingDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Starting Date</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
										<FormMessage />
									</FormItem>
								)}
							/>
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
						</>
					)}
				</>
			),
			formData: createContractFormData
		},
		{
			title: "Calculate Earnings",
			icon: Calculator,
			dialogContent: (
				<>
					<FormField
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium mr-4">Select Dates</FormLabel>
								<FormControl>
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
														<span>Pick a date</span>
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
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: earningsFormData
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
						columns={columns(handleDelete, handleEdit, employeeId)}
						data={contracts}
						filters={["employeeId"]}
						facetedFilters={["type"]}
					/>
				}
			/>
			<Sheet open={isEarningsSheetOpen} onOpenChange={() => setIsEarningsSheetOpen(false)}>
				<SheetContent side="bottom">
					<SheetHeader className="mb-6">
						<SheetTitle>
							{selectedDateRange
								? `Employees Earnings: ${format(selectedDateRange.from, "LLL dd, y")} - ${format(
										selectedDateRange.to,
										"LLL dd, y"
								  )}`
								: "Employees Earnings"}
						</SheetTitle>
						<SheetDescription></SheetDescription>
					</SheetHeader>
					<DataTable
						columns={earningsColumns()}
						data={earningsData}
						filters={["employeeId"]}
						className="[&_tr_td:last-child]:hidden [&_tr_th:last-child]:hidden"
					/>
				</SheetContent>
			</Sheet>
		</>
	);
}

const earningsColumns = (): ColumnDef<EmployeesEarningsInPeriod>[] => [
	{
		accessorKey: "employeeId",
		header: ({ column }) => <TableSortableHeader column={column} title="Employee ID" />,
		cell: ({ row }) => {
			return <div>{row.original.employeeId.toString().padStart(4, "0")}</div>;
		}
	},
	{
		accessorKey: "startingDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Starting Date" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("startingDate"));
			return <div className="font-medium">{date.toLocaleDateString()}</div>;
		}
	},
	{
		accessorKey: "endingDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Ending Date" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("endingDate"));
			return <div className="font-medium">{date.toLocaleDateString()}</div>;
		}
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => <TableSortableHeader column={column} title="Hourly Fee" />,
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("hourlyFee"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD"
			})
				.format(amount)
				.replace("$", "$ ");
			return <div className="font-medium">{formatted}</div>;
		}
	},
	{
		accessorKey: "totalEarnings",
		header: ({ column }) => <TableSortableHeader column={column} title="Total Earnings" />,
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("totalEarnings"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD"
			})
				.format(amount)
				.replace("$", "$ ");
			return <div className="font-medium">{formatted}</div>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {}
	}
];
