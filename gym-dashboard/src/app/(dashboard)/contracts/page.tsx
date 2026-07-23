"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { ContractTypeBadge } from "@/components/ui/domain-badge";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    ContractDTO,
    createContract,
    deleteContract,
    editContract,
    EmployeesEarningsInPeriod,
    getEmployeesEarningsInPeriod,
    listContracts
} from "@/data-access/contracts";
import { getEmployeesWithoutContract } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { useEntityList } from "@/hooks/useEntityList";
import { cn } from "@/lib/utils";
import { formatCurrencyEur, formatDateIt } from "@/lib/format";
import { ContractType, Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Banknote, Calculator, Calendar as CalendarIcon, Clock3, PlusCircle, Shapes, UserRound } from "lucide-react";
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
	const {
		data: contracts,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch,
		handleDelete,
		handleEdit
	} = useEntityList<ContractDTO, "employeeId" | "startingDate">(
		useMemo(
			() => ({
				list: listContracts,
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
				getAll: getEmployeesWithoutContract,
			}),
			[]
		),
		["id"]
	);

	const handleCreateContract = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			try {
				await createContract(values);
				await refetch();
				setEmployeesWithoutContract((prevEmployees) =>
					prevEmployees.filter((employee) => employee.id !== values.employeeId)
				);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Impossibile creare il Contratto.";
				toast.error(message);
				throw error;
			}
		},
		[refetch, setEmployeesWithoutContract]
	);

	const handleEditContract = useCallback(
		async (contract: ContractDTO) => {
			try {
				await handleEdit(contract);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Impossibile aggiornare il Contratto.";
				toast.error(message);
				throw error;
			}
		},
		[handleEdit]
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
			title: "Nuovo Contratto",
			icon: PlusCircle,
			dialogContent: (
				<>
					{employeesWithoutContract.length === 0 ? (
						<div className="text-center text-sm text-muted-foreground">Non ci sono Dipendenti senza Contratto</div>
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
													<SelectValue placeholder="Seleziona un Dipendente" />
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
										<FormLabel>Costo orario</FormLabel>
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
							<ContractEndingDateField>
								<FormField
									name="endingDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Data fine</FormLabel>
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
																{field.value ? formatDateIt(field.value) : <span>Scegli una data</span>}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value ?? undefined}
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
							</ContractEndingDateField>
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
								<FormLabel className="text-sm font-medium mr-4">Seleziona periodo</FormLabel>
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
																{format(field.value.from, "dd/MM/yyyy")} - {format(field.value.to, "dd/MM/yyyy")}
															</>
														) : (
															format(field.value.from, "dd/MM/yyyy")
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
		<EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Contratto">
			<>
				<Dashboard
					actions={actions}
					table={
						<DataTable
							columns={columns(handleDelete, handleEditContract, employeeId)}
							data={contracts}
							entityLabel="Contratto"
							filters={["employee"]}
							facetedFilters={["typeLabel"]}
							filterLabels={{
								employee: "Dipendente",
								typeLabel: "Tipo",
								hourlyFee: "Costo orario",
								startingDate: "Inizio",
								endingDate: "Fine"
							}}
							server={{
								query,
								onQueryChange: setQuery,
								total,
								facetOptions: facets
							}}
						/>
					}
				/>
				<Sheet open={isEarningsSheetOpen} onOpenChange={() => setIsEarningsSheetOpen(false)}>
					<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
						<SheetHeader className="mb-4">
							<SheetTitle>
								{selectedDateRange
									? `Guadagni Dipendenti · ${formatDateIt(selectedDateRange.from)} – ${formatDateIt(
											selectedDateRange.to
										)}`
									: "Guadagni Dipendenti"}
							</SheetTitle>
							<SheetDescription>
								Ore da Timbrature nel periodo × costo orario del Contratto attivo.
							</SheetDescription>
						</SheetHeader>
						{/* Period already bounds the dataset — client filter/pagination stays coherent without ListQuery. */}
						<DataTable
							columns={earningsColumns()}
							data={earningsData}
							entityLabel="guadagno periodo"
							entityLabel="Guadagno"
							filters={["employeeLabel"]}
							facetedFilters={["typeLabel"]}
							filterLabels={{
								employeeLabel: "Dipendente",
								typeLabel: "Tipo",
								hourlyFee: "Costo orario",
								totalHours: "Ore",
								totalEarnings: "Totale",
							}}
							emptyGuidance="Nessun contratto/timbratura nel periodo: amplia le date e ricalcola."
							className="[&_tr_td:last-child]:hidden [&_tr_th:last-child]:hidden"
						/>
					</SheetContent>
				</Sheet>
			</>
		</EntityShell>
	);
}

function formatHours(hours: number): string {
	const value = Number.isFinite(hours) ? hours : 0;
	return `${value.toLocaleString("it-IT", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	})} h`;
}

const earningsColumns = (): ColumnDef<EmployeesEarningsInPeriod>[] => [
	{
		id: "employeeLabel",
		accessorKey: "employeeLabel",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Dipendente" icon={UserRound} />
		),
		cell: ({ row }) => (
			<div className="min-w-0">
				<p className="font-medium text-foreground">{row.original.employeeLabel}</p>
				<p className="text-sm tabular-nums text-muted-foreground">
					#{row.original.employeeId.toString().padStart(4, "0")}
				</p>
			</div>
		),
	},
	{
		id: "typeLabel",
		accessorKey: "typeLabel",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Shapes} />
		),
		cell: ({ row }) => <ContractTypeBadge type={row.original.type} />,
	},
	{
		accessorKey: "hourlyFee",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Costo orario" icon={Banknote} />
		),
		cell: ({ row }) => (
			<div className="text-right font-medium tabular-nums">
				{formatCurrencyEur(row.getValue("hourlyFee"))}
			</div>
		),
	},
	{
		accessorKey: "totalHours",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Ore" icon={Clock3} />
		),
		cell: ({ row }) => (
			<div className="text-right tabular-nums text-foreground">
				{formatHours(row.getValue("totalHours"))}
			</div>
		),
	},
	{
		accessorKey: "totalEarnings",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Totale" icon={Banknote} />
		),
		cell: ({ row }) => (
			<div className="text-right font-medium tabular-nums">
				{formatCurrencyEur(row.getValue("totalEarnings"))}
			</div>
		),
	},
	{
		id: "actions",
		cell: () => null,
	},
];
