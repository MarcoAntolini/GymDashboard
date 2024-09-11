"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createContract, deleteContract, editContract, getAllContracts } from "@/data-access/contracts";
import { useEntityData } from "@/hooks/useEntityData";
import { Contract, ContractType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Contracts() {
	const {
		data: contracts,
		setData: setContracts,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Contract, "employeeId" | "startingDate">(
		useMemo(
			() => ({
				getAll: getAllContracts,
				deleteAction: deleteContract,
				editAction: editContract,
			}),
			[]
		),
		["employeeId", "startingDate"]
	);

	const handleCreateContract = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newContract = await createContract(values);
			setContracts((prevContracts) => [...prevContracts, newContract]);
		},
		[setContracts]
	);

	const actions: Action[] = [
		{
			title: "Add Contract",
			icon: PlusCircle,
			dialogContent: (
				<>
					<FormField
						name="employeeId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Employee ID</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										onChange={(e) => field.onChange(parseInt(e.target.value))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contract Type</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
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
										type="number"
										step="0.01"
										{...field}
										onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
								<FormControl>
									<Input
										type="date"
										{...field}
										onChange={(e) => field.onChange(new Date(e.target.value))}
									/>
								</FormControl>
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
									<Input
										type="date"
										{...field}
										onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					employeeId: 0,
					type: ContractType.FixedTerm,
					hourlyFee: 0,
					startingDate: new Date(),
					endingDate: undefined,
				},
				submitAction: handleCreateContract,
			} as FormData<typeof formSchema>,
		},
	];

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={contracts}
					filters={["employeeId"]}
					facetedFilters={["type"]}
				/>
			}
		/>
	);
}
