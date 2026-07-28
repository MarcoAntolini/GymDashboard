"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { formatDateIt } from "@/lib/format";
import { Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Briefcase, Calendar, Hash, IdCard, MapPin, User } from "lucide-react";
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
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.id.toString().padStart(4, "0")}</div>
		),
	},
	{
		accessorKey: "taxCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="CF" icon={IdCard} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Nome" icon={User} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "surname",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cognome" icon={User} />
		),
		meta: columnMeta(ColumnClass.Native),
	},
	{
		accessorKey: "birthDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Nascita" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<div className="font-medium">{formatDateIt(row.original.birthDate)}</div>
		),
	},
	{
		accessorKey: "city",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Città" icon={MapPin} />
		),
		meta: columnMeta(ColumnClass.Native),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "province",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Provincia" icon={MapPin} />
		),
		meta: columnMeta(ColumnClass.Native),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "hiringDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data assunzione" icon={Briefcase} />
		),
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
										<FormDateField
											value={field.value}
											onChange={field.onChange}
											disabledDates={(date) =>
												date > new Date() || date < new Date("1900-01-01")
											}
											defaultMonth={field.value || new Date()}
										/>
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
						<FormField
							name="hiringDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data assunzione</FormLabel>
									<FormDateField
										value={field.value}
										onChange={field.onChange}
										disabledDates={(date) => date < new Date("1900-01-01")}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
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
