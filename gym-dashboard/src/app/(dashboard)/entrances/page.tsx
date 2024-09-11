"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createEntrance, deleteEntrance, editEntrance, getAllEntrances } from "@/data-access/entrances";
import { useEntityData } from "@/hooks/useEntityData";
import { Entrance } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function EntrancesPage() {
  const {
    data: entrances,
    setData: setEntrances,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Entrance, "clientId" | "date">(
    useMemo(
      () => ({
        getAll: getAllEntrances,
        deleteAction: deleteEntrance,
        editAction: editEntrance,
      }),
      []
    ),
    ["clientId", "date"]
  );

  const handleCreateEntrance = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newEntrance = await createEntrance(values);
      setEntrances((prevEntrances) => [...prevEntrances, newEntrance]);
    },
    [setEntrances]
  );

  const actions: Action[] = [
    {
      title: "Add Entrance",
      icon: PlusCircle,
      dialogContent: (
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
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
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
          clientId: 0,
          date: new Date(),
        },
        submitAction: handleCreateEntrance,
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
          data={entrances}
          filters={["clientId", "date"]}
          facetedFilters={["date"]}
        />
      }
    />
  );
}