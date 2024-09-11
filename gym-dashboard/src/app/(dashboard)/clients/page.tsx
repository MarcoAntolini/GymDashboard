"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient, deleteClient, editClient, getAllClients } from "@/data-access/clients";
import { useEntityData } from "@/hooks/useEntityData";
import { Client } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function ClientsPage() {
  const {
    data: clients,
    setData: setClients,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Client, "id">(
    useMemo(
      () => ({
        getAll: getAllClients,
        deleteAction: deleteClient,
        editAction: editClient,
      }),
      []
    ),
    ["id"]
  );

  const handleCreateClient = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newClient = await createClient(values);
      setClients((prevClients) => [...prevClients, newClient]);
    },
    [setClients]
  );

  const actions: Action[] = [
    {
      title: "Add Client",
      icon: PlusCircle,
      dialogContent: (
        <>
          <FormField
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Add more form fields for other client properties */}
        </>
      ),
      formData: {
        formSchema,
        defaultValues: {
          taxCode: "",
          name: "",
          surname: "",
          birthDate: new Date(),
          street: "",
          houseNumber: "",
          city: "",
          province: "",
          phoneNumber: "",
          email: "",
          enrollmentDate: new Date(),
          remainingEntrances: 0,
        },
        submitAction: handleCreateClient,
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
          data={clients}
          filters={["taxCode", "name", "surname"]}
          facetedFilters={["city", "province"]}
        />
      }
    />
  );
}