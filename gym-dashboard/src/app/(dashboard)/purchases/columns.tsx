"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Purchase, PurchaseType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  clientId: z.number().int().positive(),
  date: z.date(),
  amount: z.number().positive(),
  type: z.nativeEnum(PurchaseType),
  productCode: z.string().min(1),
});

export const columns = (
  handleDelete: (purchase: Pick<Purchase, "clientId" | "date">) => Promise<void>,
  handleEdit: (purchase: Purchase) => Promise<void>
): ColumnDef<Purchase>[] => [
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
    accessorKey: "client.name",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Client Name"
      />
    ),
  },
  {
    accessorKey: "client.surname",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Client Surname"
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
      return <div className="font-medium">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Amount"
      />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Type"
      />
    ),
  },
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
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PurchaseType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="productCode"
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
          const updatedPurchase = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedPurchase);
        }}
        deleteAction={() => handleDelete({ clientId: row.original.clientId, date: row.original.date })}
      />
    ),
  },
];
