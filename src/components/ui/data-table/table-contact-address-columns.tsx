"use client";

import { TableStackedPair } from "@/components/ui/data-table/table-cells";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { ColumnClass, columnMeta } from "@/lib/domain/column-class";
import { ColumnDef } from "@tanstack/react-table";
import { Mail, MapPin } from "lucide-react";

export type ContactAddressFields = {
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
};

function lineStreet(person: ContactAddressFields): string {
	return `${person.street} ${person.houseNumber}`.trim();
}

function lineCity(person: ContactAddressFields): string {
	return `${person.city} (${person.province})`;
}

export function contactAddressColumns<T extends ContactAddressFields>(): ColumnDef<T>[] {
	return [
		{
			id: "address",
			accessorFn: (row) => `${lineStreet(row)} ${lineCity(row)}`,
			enableSorting: false,
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Indirizzo" icon={MapPin} />
			),
			meta: columnMeta(ColumnClass.Native, { stacked: true }),
			size: 180,
			minSize: 140,
			cell: ({ row }) => (
				<TableStackedPair
					primary={lineStreet(row.original)}
					secondary={lineCity(row.original)}
				/>
			),
		},
		{
			id: "contact",
			accessorFn: (row) => `${row.phoneNumber} ${row.email}`,
			enableSorting: false,
			header: ({ column }) => (
				<TableSortableHeader column={column} title="Contatto" icon={Mail} />
			),
			meta: columnMeta(ColumnClass.Native, { stacked: true }),
			size: 176,
			minSize: 140,
			cell: ({ row }) => (
				<TableStackedPair
					primary={row.original.phoneNumber}
					secondary={row.original.email}
				/>
			),
		},
	];
}
