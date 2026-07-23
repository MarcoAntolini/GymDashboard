"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createMembership,
  deleteMembership,
  editMembership,
  listMemberships,
  type MembershipDTO,
} from "@/data-access/memberships";
import { useEntityList } from "@/hooks/useEntityList";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function MembershipsPage() {
  const {
    data: memberships,
    total,
    facets,
    query,
    setQuery,
    handleDelete,
    handleEdit,
    refetch,
  } = useEntityList<MembershipDTO, "productCode">(
    useMemo(
      () => ({
        list: listMemberships,
        deleteAction: deleteMembership,
        editAction: editMembership,
      }),
      []
    ),
    ["productCode"]
  );

  const handleCreateMembership = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await createMembership(values);
      await refetch();
    },
    [refetch]
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

  return (
    <Dashboard
      actions={actions}
      table={
        <DataTable
          columns={columns(handleDelete, handleEdit)}
          data={memberships}
          filters={["productCode"]}
          facetedFilters={["duration"]}
          server={{
            query,
            onQueryChange: setQuery,
            total,
            facetOptions: facets,
          }}
        />
      }
    />
  );
}