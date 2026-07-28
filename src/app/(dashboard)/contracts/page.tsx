"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
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
	type ContractRow,
} from "@/data-access/contracts";
import { getEmployeesWithoutContract } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { useServerList } from "@/hooks/useServerList";
import {
	CONTRACT_DEFAULT_SORT,
	CONTRACT_FILTER_ALLOWLIST,
	CONTRACT_SORT_ALLOWLIST,
	CONTRACT_FILTER_LABELS,
} from "@/lib/list/contracts";
import { cn } from "@/lib/utils";
import { Contract, ContractType, Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateIt, formatEur } from "@/lib/format";
import { Calculator, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { columns, formSchema } from "./columns";
import { ContractEndingDateField } from "./contract-ending-date-field";

const earningsFormSchema = z.object({
	date: z.object({
		from: z.date(),
		to: z.date()
	})
});

export default function Contracts() {
	const list = useServerList<ContractRow>({
		list: listContracts,
		sortAllowlist: CONTRACT_SORT_ALLOWLIST,
		filterAllowlist: CONTRACT_FILTER_ALLOWLIST,
		defaultSort: [...CONTRACT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const { data: employeesWithoutContract, setData: setEmployeesWithoutContract } = useEntityData<Employee, "id">(
		useMemo(
			() => ({
				getAll: getEmployeesWithoutContract,
			}),
			[]
		),
		["id"]
	);

	const handleDelete = useCallback(
		async (contract: Pick<Contract, "employeeId" | "startingDate">) => {
			await deleteContract(contract);
			refetch();
		},
		[refetch]
	);

	const handleCreateContract = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			try {
				await createContract(values);
				setEmployeesWithoutContract((prevEmployees) =>
					prevEmployees.filter((employee) => employee.id !== values.employeeId)
				);
				refetch();
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile creare il contratto.";
				toast.error(message);
				throw error;
			}
		},
		[refetch, setEmployeesWithoutContract]
	);

	const handleEditContract = useCallback(
		async (contract: Contract) => {
			try {
				const updated = await editContract(contract);
				setItems((prev) =>
					prev.map((item) =>
						item.employeeId === updated.employeeId &&
						new Date(item.startingDate).getTime() ===
							new Date(updated.startingDate).getTime()
							? updated
							: item
					)
				);
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile aggiornare il contratto.";
				toast.error(message);
				throw error;
			}
		},
		[setItems]
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
		fetch("/api/auth/me")
			.then((r) => (r.ok ? r.json() : null))
			.then((me) => {
				setEmployeeId(typeof me?.employeeId === "number" ? me.employeeId : 0);
			});
	}, []);

	const actions: Action[] = [
		{
			title: "Aggiungi contratto",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutContract.length === 0 ? (
						<div className="text-center text-sm text-muted-foreground">Non ci sono dipendenti senza contratto</div>
					) : (
						<>
							<FormField
								name="employeeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dipendente</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(parseInt(value, 10))}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona un dipendente" />
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
										<FormLabel>Tipo contratto</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona un tipo di contratto" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={ContractType.FixedTerm}>Tempo determinato</SelectItem>
												<SelectItem value={ContractType.OpenEnded}>Tempo indeterminato</SelectItem>
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
										<FormLabel>Compenso orario</FormLabel>
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
										<FormLabel>Data inizio</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
													>
														{field.value ? formatDateIt(field.value) : <span>Scegli una data</span>}
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
							<ContractEndingDateField variant="calendar" />
						</>
					)}
				</>
			),
			formData: createContractFormData
		},
		{
			title: "Calcola guadagni",
			icon: Calculator,
			dialogContent: (
				<>
					<FormField
						name="date"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium mr-4">Seleziona date</FormLabel>
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
																{formatDateIt(field.value.from)} - {formatDateIt(field.value.to)}
															</>
														) : (
															formatDateIt(field.value.from)
														)
													) : (
														<span>Scegli una data</span>
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

	return (
		<>
			<Dashboard
				actions={actions}
				table={
					<DataTable
						columns={columns(handleDelete, handleEditContract, employeeId)}
						getRowId={(row) =>
							`${row.employeeId}::${new Date(row.startingDate).toISOString()}`
						}
						entityLabel="Contratto"
						bulkDeleteRow={async (row) => {
							await deleteContract({
								employeeId: row.employeeId,
								startingDate: row.startingDate,
							});
						}}
						onBulkComplete={refetch}
						data={list.items}
						isLoading={list.isLoading}
						error={list.error}
						onRetry={list.refetch}
						filters={[...CONTRACT_FILTER_ALLOWLIST]}
						filterLabels={CONTRACT_FILTER_LABELS}
						emptyState={
							<TableEmptyState
								title="Nessun contratto"
								hint="Usa Aggiungi contratto per registrare il primo Contratto."
							/>
						}
						serverList={{
							manual: true,
							pageCount: list.pageCount,
							rowCount: list.total,
							sorting: list.sorting,
							onSortingChange: list.onSortingChange,
							pagination: list.pagination,
							onPaginationChange: list.onPaginationChange,
							draftFilters: list.draftFilters,
							onDraftFilterChange: list.setDraftFilter,
							onApplyFilters: list.applyFilters,
							onResetFilters: list.resetFilters,
							filtersDirty: list.filtersDirty,
							appliedFilters: list.query.filters,
						}}
					/>
				}
			/>
			<Sheet open={isEarningsSheetOpen} onOpenChange={() => setIsEarningsSheetOpen(false)}>
				<SheetContent side="bottom">
					<SheetHeader className="mb-6">
						<SheetTitle>
							{selectedDateRange
								? `Guadagni dipendenti: ${formatDateIt(selectedDateRange.from)} - ${formatDateIt(selectedDateRange.to)}`
								: "Guadagni dipendenti"}
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
		header: ({ column }) => <TableSortableHeader column={column} title="ID Dipendente" />,
		cell: ({ row }) => {
			return <div>{row.original.employeeId.toString().padStart(4, "0")}</div>;
		}
	},
	// {
	// 	accessorKey: "startingDate",
	// 	header: ({ column }) => <TableSortableHeader column={column} title="Starting Date" />,
	// 	cell: ({ row }) => {
	// 		const date = new Date(row.getValue("startingDate"));
	// 		return <div className="font-medium">{date.toLocaleDateString()}</div>;
	// 	}
	// },
	// {
	// 	accessorKey: "endingDate",
	// 	header: ({ column }) => <TableSortableHeader column={column} title="Ending Date" />,
	// 	cell: ({ row }) => {
	// 		const date = new Date(row.getValue("endingDate"));
	// 		return <div className="font-medium">{date.toLocaleDateString()}</div>;
	// 	}
	// },
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => <TableSortableHeader column={column} title="Compenso orario" />,
		cell: ({ row }) => {
			const amount = Number(row.original.hourlyFee);
			return <div className="font-medium">{formatEur(amount)}</div>;
		}
	},
	{
		accessorKey: "totalEarnings",
		header: ({ column }) => <TableSortableHeader column={column} title="Guadagni totali" />,
		cell: ({ row }) => {
			const amount = Number(row.original.totalEarnings);
			return <div className="font-medium">{formatEur(amount)}</div>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {}
	}
];
