"use client";

import { NumericCell } from "@/components/ui/data-table/table-cells";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type EntranceSetDTO } from "@/data-access/entranceSets";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  entranceNumber: z.number().int().positive("Number of entrances must be a positive integer"),
});

export const columns = (
  handleDelete: (entranceSet: Pick<EntranceSetDTO, "productCode">) => Promise<void>,
  handleEdit: (entranceSet: EntranceSetDTO) => Promise<void>
): ColumnDef<EntranceSetDTO>[] => [
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
    accessorKey: "entranceNumber",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Number of Entrances"
        align="right"
      />
    ),
    cell: ({ row }) => (
      <NumericCell tooltip="Entrances included in this package">
        {row.getValue("entranceNumber") as number}
      </NumericCell>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        entityLabel="entrance set"
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
