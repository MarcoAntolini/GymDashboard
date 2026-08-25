"use client";

import { TableCode, TableDate, TableId } from "@/components/ui/data-table/table-cells";
import { contactAddressColumns } from "@/components/ui/data-table/table-contact-address-columns";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { taxCodeSample } from "@/components/ui/data-table/table-width-samples";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import { Employee } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { z } from "zod";

export const formSchema = z.object({
	name: z.string().min(1, "Il nome è obbligatorio"),
	surname: z.string().min(1, "Il cognome è obbligatorio"),
	taxCode: z.string().length(16, "Il codice fiscale deve essere di 16 caratteri"),
	birthDate: z.date({
		error: "La data di nascita è obbligatoria",
	}),
	street: z.string().min(1, "La via è obbligatoria"),
	houseNumber: z.string().min(1, "Il civico è obbligatorio"),
	city: z.string().min(1, "La città è obbligatoria"),
	province: z.string().min(1, "La provincia è obbligatoria"),
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
			<TableSortableHeader column={column} title="ID" icon={ATTR_ICON.id} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.id} pad={4} filterKeys="id" />
		),
	},
	{
		accessorKey: "taxCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="CF" icon={ATTR_ICON.taxCode} />
		),
		meta: columnMeta(ColumnClass.Native, {
			width: ColumnWidth.Content,
			widthSamples: [taxCodeSample()],
		}),
		cell: ({ row }) => (
			<TableCode value={row.original.taxCode} filterKeys="taxCode" compact />
		),
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Nome" icon={ENTITY_ICON.employee} />
		),
		meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
	},
	{
		accessorKey: "surname",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cognome" icon={ENTITY_ICON.employee} />
		),
		meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
	},
	{
		accessorKey: "birthDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data di nascita" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.birthDate} />,
	},
	...contactAddressColumns<Employee>(),
	{
		accessorKey: "hiringDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data assunzione" icon={ATTR_ICON.date} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.hiringDate} />,
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
