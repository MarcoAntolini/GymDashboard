"use client";

import { TableCode, TableDate, TableId } from "@/components/ui/data-table/table-cells";
import { contactAddressColumns } from "@/components/ui/data-table/table-contact-address-columns";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { Client } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
	Calendar,
	Hash,
	IdCard,
	User,
} from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
	taxCode: z.string().min(1, "Il codice fiscale è obbligatorio"),
	name: z.string().min(1, "Il nome è obbligatorio"),
	surname: z.string().min(1, "Il cognome è obbligatorio"),
	birthDate: z.date(),
	street: z.string().min(1, "La via è obbligatoria"),
	houseNumber: z.string().min(1, "Il civico è obbligatorio"),
	city: z.string().min(1, "La città è obbligatoria"),
	province: z.string().min(1, "La provincia è obbligatoria"),
	phoneNumber: z.string().min(1, "Il telefono è obbligatorio"),
	email: z.string().email("Indirizzo email non valido"),
	enrollmentDate: z.date(),
});

export const columns = (
	handleDelete: (client: Pick<Client, "id">) => Promise<void>,
	handleEdit: (client: Client) => Promise<void>
): ColumnDef<Client>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} align="right" />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableId value={row.original.id} filterKeys="id" />
		),
	},
	{
		accessorKey: "taxCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice fiscale" icon={IdCard} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableCode value={row.original.taxCode} filterKeys="taxCode" compact />
		),
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
			<TableSortableHeader column={column} title="Data di nascita" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.birthDate} />,
	},
	...contactAddressColumns<Client>(),
	{
		accessorKey: "enrollmentDate",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data iscrizione" icon={Calendar} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => <TableDate value={row.original.enrollmentDate} />,
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Cliente"
				deleteDescription="Se il Cliente ha Vendite collegate, l'eliminazione viene rifiutata (vincolo Restrict)."
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
											<Input {...field} type="email" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								name="enrollmentDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data iscrizione</FormLabel>
										<FormDateField
											value={field.value}
											onChange={field.onChange}
											disabledDates={(date) => date < new Date("1900-01-01")}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</>
				}
				editAction={async ({ values }) => {
					const updatedClient = {
						...row.original,
						...values,
					};
					await handleEdit(updatedClient);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
