"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Membership } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  duration: z.number().int().positive("Duration must be a positive integer"),
});

export const columns = (
  handleDelete: (membership: Pick<Membership, "productCode">) => Promise<void>,
  handleEdit: (membership: Membership) => Promise<void>
): ColumnDef<Membership>[] => [
  {
    accessorKey: "productCode",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Product Code"
      />
    ),
  },
  {
    accessorKey: "duration",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Duration (days)"
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
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (days)</FormLabel>
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
          </>
        }
        editAction={async ({ values }) => {
          const updatedMembership = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedMembership);
        }}
        deleteAction={() => handleDelete({ productCode: row.original.productCode })}
      />
    ),
  },
];