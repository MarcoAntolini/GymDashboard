"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Entrance } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  clientId: z.number().int().positive(),
  date: z.date(),
});

export const columns = (
  handleDelete: (entrance: Pick<Entrance, "clientId" | "date">) => Promise<void>,
  handleEdit: (entrance: Entrance) => Promise<void>
): ColumnDef<Entrance>[] => [
  {
    accessorKey: "clientId",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Client ID"
      />
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Date"
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return <div className="font-medium">{date.toLocaleString()}</div>;
    },
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
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        }
        editAction={async ({ values }) => {
          const updatedEntrance = {
            ...row.original,
            ...values,
            date: new Date(values.date),
          };
          await handleEdit(updatedEntrance);
        }}
        deleteAction={() => handleDelete({ clientId: row.original.clientId, date: row.original.date })}
      />
    ),
  },
];