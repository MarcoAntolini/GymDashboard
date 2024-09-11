"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Payment, PaymentType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

export const formSchema = z.object({
  date: z.date(),
  amount: z.number().positive("Amount must be a positive number"),
  type: z.nativeEnum(PaymentType),
});

export const columns = (
  handleDelete: (payment: Pick<Payment, "id">) => Promise<void>,
  handleEdit: (payment: Payment) => Promise<void>
): ColumnDef<Payment>[] => [
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
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        editFormContent={
          <>
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
                      {Object.values(PaymentType).map((type) => (
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
          </>
        }
        editAction={async ({ values }) => {
          const updatedPayment = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedPayment);
        }}
        deleteAction={() => handleDelete({ id: row.original.id })}
      />
    ),
  },
];
