"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntranceSet } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Package, Ticket } from "lucide-react";
import { z } from "zod";

export const formSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  entranceNumber: z.number().int().positive("Number of entrances must be a positive integer"),
});

export const columns = (
  handleDelete: (entranceSet: Pick<EntranceSet, "productCode">) => Promise<void>,
  handleEdit: (entranceSet: EntranceSet) => Promise<void>
): ColumnDef<EntranceSet>[] => [
  {
    accessorKey: "productCode",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Product Code"
        icon={Package}
      />
    ),
  },
  {
    accessorKey: "entranceNumber",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Number of Entrances"
        icon={Ticket}
        align="right"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">
        {row.original.entranceNumber}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        entityLabel="Pacchetto ingressi"
        editFormContent={
          <>
            <FormField
              name="productCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="entranceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Entrances</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="text-right tabular-nums"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        }
        editAction={async ({ values }) => {
          const updatedEntranceSet = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedEntranceSet);
        }}
        deleteAction={() => handleDelete({ productCode: row.original.productCode })}
      />
    ),
  },
];
