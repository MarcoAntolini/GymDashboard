"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
	createContract,
	deleteContract,
	editContract,
	EmployeesEarningsInPeriod,
	getEmployeesEarningsInPeriod,
	listContracts,
	type ContractListResult,
	type ContractRow,
} from "@/data-access/contracts";
import { getEmployeesWithoutContract } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import {
	CONTRACT_LIST_DEFAULT_SORT,
	CONTRACT_LIST_FILTER_IDS,
	CONTRACT_LIST_SORT_COLUMNS,
} from "@/lib/domain/contract-list-query";
import { cn } from "@/lib/utils";
import { ContractType, Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calculator, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ContractEndingDateField } from "./contract-ending-date-field";
import { columns, formSchema } from "./columns";

const earningsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date(),
	}),
});

const CONTRACT_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "employeeId", label: "ID dipendente", placeholder: "ID dipendente" },
	{
		id: "type",
		label: "Tipo contratto",
		placeholder: "FixedTerm / Tempo determinato",
	},
];

const EMPTY_FILTERS = Object.fromEntries(
	CONTRACT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof CONTRACT_LIST_FILTER_IDS)[number], string>;

export default function Contracts() {
	const listQuery = useServerListQuery({
		allowedSortColumns: CONTRACT_LIST_SORT_COLUMNS,
		defaultSort: CONTRACT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<ContractListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listContracts(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const { data: employeesWithoutContract, setData: setEmployeesWithoutContract } =
		useEntityData<Employee, "id">(
			useMemo(
				() => ({
					getAll: getEmployeesWithoutContract,
				}),
				[]
			),
			["id"]
		);

	const refreshEmployeesWithoutContract = useCallback(async () => {
		const next = await getEmployeesWithoutContract();
		setEmployeesWithoutContract(next);
	}, [setEmployeesWithoutContract]);

	const handleDelete = useCallback(
		async (contract: Pick<ContractRow, "employeeId" | "startingDate">) => {
			await deleteContract(contract);
			await fetchList();
			await refreshEmployeesWithoutContract();
		},
		[fetchList, refreshEmployeesWithoutContract]
	);

	const handleEdit = useCallback(
		async (contract: ContractRow) => {
			await editContract(contract);
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateContract = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createContract(values);
			await fetchList();
			await refreshEmployeesWithoutContract();
		},
		[fetchList, refreshEmployeesWithoutContract]
	);

	const createContractFormData: FormData<typeof formSchema> = {
		formSchema,
		defaultValues: {
			employeeId: 0,
			type: ContractType.FixedTerm,
			hourlyFee: "",
			startingDate: new Date(),
			endingDate: undefined,
		},
		submitAction: handleCreateContract,
	};

	const [isEarningsSheetOpen, setIsEarningsSheetOpen] = useState(false);
	const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(
		null
	);
	const handleCalculateEarnings = useCallback(
		async (values: z.infer<typeof earningsFormSchema>) => {
			const earnings = await getEmployeesEarningsInPeriod({
				startingDate: values.date.from,
				endingDate: values.date.to,
			});
			setEarningsData(earnings);
			setSelectedDateRange(values.date);
			setIsEarningsSheetOpen(true);
		},
		[]
	);
	const earningsFormData: FormData<typeof earningsFormSchema> = {
		formSchema: earningsFormSchema,
		defaultValues: {
			date: {
				from: new Date(),
				to: new Date(),
			},
		},
		submitAction: handleCalculateEarnings,
	};
	const [earningsData, setEarningsData] = useState<EmployeesEarningsInPeriod[]>([]);

	const [employeeId, setEmployeeId] = useState(0);
	useEffect(() => {
		fetch("/api/auth/me")
			.then((r) => (r.ok ? r.json() : null))
			.then((me) => {
				setEmployeeId(typeof me?.employeeId === "number" ? me.employeeId : 0);
			});
	}, []);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit, employeeId),
		[handleDelete, handleEdit, employeeId]
	);

	const actions: Action[] = [
		{
			title: "Add Contract",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutContract.length === 0 ? (
						<div className="text-center text-sm text-muted-foreground">
							There are no employees without a contract
						</div>
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
										<Select onValueChange={field.onChange} value={field.value}>
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
											<Input type="text" inputMode="decimal" {...field} />
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
										<FormMessage />
									</FormItem>
								)}
							/>
							<ContractEndingDateField mode="calendar" />
						</>
					)}
				</>
			),
			formData: createContractFormData,
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
																{format(field.value.from, "LLL dd, y")} -{" "}
																{format(field.value.to, "LLL dd, y")}
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
			formData: earningsFormData,
		},
	];

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<>
			<Dashboard
				actions={actions}
				table={
					<ServerDataTable
						columns={tableColumns}
						data={result?.rows ?? []}
						total={result?.total ?? 0}
						page={listQuery.page}
						pageSize={listQuery.pageSize}
						pageCount={result?.pageCount ?? 0}
						sort={listQuery.sort}
						onSortChange={listQuery.setSort}
						onPageChange={listQuery.setPage}
						onPageSizeChange={listQuery.setPageSize}
						filterFields={CONTRACT_FILTER_FIELDS}
						draftFilters={listQuery.draftFilters}
						onDraftFilterChange={listQuery.setDraftFilter}
						onApplyFilters={listQuery.applyFilters}
						onResetFilters={listQuery.resetFilters}
						isFilterDirty={listQuery.isFilterDirty}
						hasAppliedFilters={listQuery.hasAppliedFilters}
						emptyKind={result?.emptyKind ?? null}
						datasetEmptyMessage="Nessun contratto registrato."
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
		},
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => <TableSortableHeader column={column} title="Hourly Fee" />,
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("hourlyFee"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			})
				.format(amount)
				.replace("$", "$ ");
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "totalEarnings",
		header: ({ column }) => <TableSortableHeader column={column} title="Total Earnings" />,
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("totalEarnings"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			})
				.format(amount)
				.replace("$", "$ ");
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		id: "actions",
		cell: () => {},
	},
];
