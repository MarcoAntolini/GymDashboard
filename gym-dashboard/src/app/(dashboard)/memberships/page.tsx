"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createMembership, deleteMembership, editMembership, getAllMemberships } from "@/data-access/memberships";
import { useEntityData } from "@/hooks/useEntityData";
import { Membership } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function MembershipsPage() {
  const {
    data: memberships,
    setData: setMemberships,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Membership, "productCode">(
    useMemo(
      () => ({
        getAll: getAllMemberships,
        deleteAction: deleteMembership,
        editAction: editMembership,
      }),
      []
    ),
    ["productCode"]
  );

  const handleCreateMembership = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newMembership = await createMembership(values);
      setMemberships((prevMemberships) => [...prevMemberships, newMembership]);
    },
    [setMemberships]
  );

  const actions: Action[] = [
    {
      title: "Add Membership",
      icon: PlusCircle,
      dialogContent: (
        <>
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
      ),
      formData: {
        formSchema,
        defaultValues: {
          productCode: "",
          duration: 30,
        },
        submitAction: handleCreateMembership,
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
          data={memberships}
          filters={["productCode"]}
          facetedFilters={["duration"]}
        />
      }
    />
  );
}