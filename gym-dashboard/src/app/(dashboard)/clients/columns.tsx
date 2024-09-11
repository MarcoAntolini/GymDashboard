"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Client } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  taxCode: z.string().min(1, "Tax Code is required"),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  birthDate: z.date(),
  street: z.string().min(1, "Street is required"),
  houseNumber: z.string().min(1, "House Number is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  email: z.string().email("Invalid email address"),
  enrollmentDate: z.date(),
  remainingEntrances: z.number().int().nonnegative(),
});

export const columns = (
  handleDelete: (client: Pick<Client, "id">) => Promise<void>,
  handleEdit: (client: Client) => Promise<void>
): ColumnDef<Client>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="ID"
      />
    ),
  },
  {
    accessorKey: "taxCode",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Tax Code"
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Name"
      />
    ),
  },
  {
    accessorKey: "surname",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Surname"
      />
    ),
  },
  {
    accessorKey: "birthDate",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Birth Date"
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("birthDate"));
      return <div className="font-medium">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="City"
      />
    ),
  },
  {
    accessorKey: "province",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Province"
      />
    ),
  },
  {
    accessorKey: "enrollmentDate",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Enrollment Date"
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("enrollmentDate"));
      return <div className="font-medium">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "remainingEntrances",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Remaining Entrances"
      />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        editFormContent={
          <>
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
            {/* Add more form fields for other client properties */}
          </>
        }
        editAction={async ({ values }) => {
          const updatedClient = {
            ...row.original,
            ...values,
            birthDate: new Date(values.birthDate),
            enrollmentDate: new Date(values.enrollmentDate),
          };
          await handleEdit(updatedClient);
        }}
        deleteAction={() => handleDelete({ id: row.original.id })}
      />
    ),
  },
];