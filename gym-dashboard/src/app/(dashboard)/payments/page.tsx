"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPayment, deletePayment, editPayment, getAllPayments } from "@/data-access/payments";
import { useEntityData } from "@/hooks/useEntityData";
import { Payment, PaymentType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function PaymentsPage() {
  const {
    data: payments,
    setData: setPayments,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Payment, "id">(
    useMemo(
      () => ({
        getAll: getAllPayments,
        deleteAction: deletePayment,
        editAction: editPayment,
      }),
      []
    ),
    ["id"]
  );

  const handleCreatePayment = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newPayment = await createPayment(values);
      setPayments((prevPayments) => [...prevPayments, newPayment]);
    },
    [setPayments]
  );

  const actions: Action[] = [
    {
      title: "Add Payment",
      icon: PlusCircle,
      dialogContent: (
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
      ),
      formData: {
        formSchema,
        defaultValues: {
          date: new Date(),
          amount: 0,
          type: PaymentType.Salary,
        },
        submitAction: handleCreatePayment,
      } as FormData<typeof formSchema>,
    },
  ];

  return isLoading ? (
    <DashboardPlaceholder />
  ) : (
    <Dashboard
      actions={actions}
      table={
        <DataTable
          columns={columns(handleDelete, handleEdit)}
          data={payments}
          filters={["type"]}
          facetedFilters={["type"]}
        />
      }
    />
  );
}