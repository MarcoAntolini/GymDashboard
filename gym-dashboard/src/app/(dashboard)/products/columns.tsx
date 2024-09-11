"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Product } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  code: z.string().min(1, "Product code is required"),
});

export const columns = (
  handleDelete: (product: Pick<Product, "code">) => Promise<void>,
  handleEdit: (product: Product) => Promise<void>
): ColumnDef<Product>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Product Code"
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        }
        editAction={async ({ values }) => {
          const updatedProduct = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedProduct);
        }}
        deleteAction={() => handleDelete({ code: row.original.code })}
      />
    ),
  },
];