"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateIt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	name: z.string().min(1, "Name is a required field"),
	surname: z.string().min(1, "Surname is a required field"),
	taxCode: z.string().length(16, "Tax Code must be 16 characters long"),
	birthDate: z.date({
		required_error: "Birth Date is a required field",
	}),
	street: z.string().min(1, "Street is a required field"),
	houseNumber: z.string().min(1, "House Number is a required field"),
	city: z.string().min(1, "City is a required field"),
	province: z.string().min(1, "Province is a required field"),
	phoneNumber: z.string(),
	email: z.string(),
	hiringDate: z.date(),
});

export const columns = (
	handleDelete: (employee: Pick<Employee, "id">) => Promise<void>,
	handleEdit: (employee: Employee) => Promise<void>
): ColumnDef<Employee>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.id.toString().padStart(4, "0")}</div>
		),
	},
	{
		accessorKey: "taxCode",
		header: ({ column }) => <TableSortableHeader column={column} title="CF" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "name",
		header: ({ column }) => <TableSortableHeader column={column} title="Nome" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "surname",
		header: ({ column }) => <TableSortableHeader column={column} title="Cognome" />,
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "birthDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Nascita" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.birthDate)}</div>
		),
	},
	{
		accessorKey: "city",
		header: ({ column }) => <TableSortableHeader column={column} title="Città" />,
		meta: columnMeta(ColumnClass.Native),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "province",
		header: ({ column }) => <TableSortableHeader column={column} title="Provincia" />,
		meta: columnMeta(ColumnClass.Native),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hiringDate",
		header: ({ column }) => <TableSortableHeader column={column} title="Data assunzione" />,
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.hiringDate)}</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Dipendente"
				editFormContent={
					<>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome</FormLabel>
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
										<FormLabel>Cognome</FormLabel>
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
										<FormLabel>Codice fiscale</FormLabel>
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
										<FormLabel>Data di nascita</FormLabel>
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
														{field.value ? format(field.value, "PPP") : <span>Scegli una data</span>}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
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
										<FormLabel>Via</FormLabel>
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
										<FormLabel>Civico</FormLabel>
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
										<FormLabel>Città</FormLabel>
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
										<FormLabel>Provincia</FormLabel>
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
										<FormLabel>Telefono</FormLabel>
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
				}
				editAction={async ({ values }) => {
					const updatedEmployee = { ...row.original, ...values };
					await handleEdit(updatedEmployee);
				}}
				deleteAction={async () => {
					await handleDelete({ id: row.original.id });
				}}
			/>
		),
	},
];
