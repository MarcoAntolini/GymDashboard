"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createEntranceSet,
  deleteEntranceSet,
  editEntranceSet,
  listEntranceSets,
  type EntranceSetDTO,
} from "@/data-access/entranceSets";
import { useEntityList } from "@/hooks/useEntityList";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function EntranceSetsPage() {
  const {
    data: entranceSets,
    total,
    facets,
    query,
    setQuery,
    handleDelete,
    handleEdit,
    refetch,
  } = useEntityList<EntranceSetDTO, "productCode">(
    useMemo(
      () => ({
        list: listEntranceSets,
        deleteAction: deleteEntranceSet,
        editAction: editEntranceSet,
      }),
      []
    ),
    ["productCode"]
  );

  const handleCreateEntranceSet = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await createEntranceSet(values);
      await refetch();
    },
    [refetch]
  );

  const actions: Action[] = [
    {
      title: "Add Entrance Set",
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
      ),
      formData: {
        formSchema,
        defaultValues: {
          productCode: "",
          entranceNumber: 10,
        },
        submitAction: handleCreateEntranceSet,
      } as FormData<typeof formSchema>,
    },
  ];

  return (
    <Dashboard
      actions={actions}
      table={
        <DataTable
          columns={columns(handleDelete, handleEdit)}
          data={entranceSets}
          filters={["productCode"]}
          facetedFilters={["entranceNumber"]}
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