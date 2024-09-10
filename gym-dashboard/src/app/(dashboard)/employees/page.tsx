"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createEmployee, deleteEmployee, editEmployee, getAllEmployees } from "@/data-access/employees";
import { useEntityData } from "@/hooks/useEntityData";
import { cn } from "@/lib/utils";
import { Employee } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function Employees() {
	const {
		data: employees,
		setData: setEmployees,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<Employee, "id">(
		useMemo(
			() => ({
				getAll: getAllEmployees,
				deleteAction: deleteEmployee,
				editAction: editEmployee,
			}),
			[]
		),
		["id"]
	);
	const handleCreateEmployee = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			const newEmployee = await createEmployee(values);
			setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
		},
		[setEmployees]
	);

	const actions: Action[] = [
		{
			title: "Add Employee",
			icon: PlusCircle,
			dialogContent: (
				<>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="surname"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Surname</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="taxCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tax Code</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="birthDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Birth Date</FormLabel>
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
										<PopoverContent
											className="w-auto p-0"
											align="start"
										>
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
												defaultMonth={field.value || new Date()}
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-4 gap-4">
						<FormField
							name="street"
							render={({ field }) => (
								<FormItem className="col-span-3">
									<FormLabel>Street</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="houseNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Number</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>City</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="province"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Province</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-8 gap-4">
						<FormField
							name="phoneNumber"
							render={({ field }) => (
								<FormItem className="col-span-3">
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="email"
							render={({ field }) => (
								<FormItem className="col-span-5">
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</>
			),
			formData: {
				formSchema,
				defaultValues: {
					name: "",
					surname: "",
					taxCode: "",
					birthDate: new Date(),
					street: "",
					houseNumber: "",
					city: "",
					province: "",
					phoneNumber: "",
					email: "",
					hiringDate: new Date(),
				},
				submitAction: handleCreateEmployee,
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
					data={employees}
					filters={["taxCode", "name", "surname"]}
					facetedFilters={["city", "province"]}
				/>
			}
		/>
	);
}
