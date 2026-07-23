"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { EntityShell } from "@/components/ui/entity-shell";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient, deleteClient, editClient, listClients } from "@/data-access/clients";
import { useEntityList } from "@/hooks/useEntityList";
import { Client } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateIt } from "@/lib/format";

export default function ClientsPage() {
  const {
    data: clients,
    total,
    facets,
    query,
    setQuery,
    isLoading,
    error,
    retry,
    refetch,
    handleDelete,
    handleEdit,
  } = useEntityList<Client, "id">(
    useMemo(
      () => ({
        list: listClients,
        deleteAction: deleteClient,
        editAction: editClient,
      }),
      []
    ),
    ["id"]
  );

  const handleCreateClient = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await createClient(values);
      await refetch();
    },
    [refetch]
  );

  const actions: Action[] = [
    {
      title: "Nuovo Cliente",
      icon: PlusCircle,
      dialogContent: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
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
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="taxCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice fiscale</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data di nascita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDateIt(field.value)
                          ) : (
                            <span>Scegli una data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <FormField
              name="street"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Via</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="houseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Civico</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Città</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-8 gap-4">
            <FormField
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            name="enrollmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data di iscrizione</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          formatDateIt(field.value)
                        ) : (
                          <span>Scegli una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
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
        },
        submitAction: handleCreateClient,
      } as FormData<typeof formSchema>,
    },
  ];

  return (
    <EntityShell isLoading={isLoading} error={error} onRetry={retry} entityLabel="Cliente">
      <Dashboard
        actions={actions}
        table={
          <DataTable
            columns={columns(handleDelete, handleEdit)}
            data={clients}
            entityLabel="Cliente"
            filters={["surname", "name", "taxCode"]}
            facetedFilters={["city", "province"]}
            filterLabels={{
              surname: "Cognome",
              name: "Nome",
              taxCode: "Codice fiscale",
              city: "Città",
              province: "Provincia",
              phoneNumber: "Telefono",
              email: "Email",
              birthDate: "Data di nascita",
              enrollmentDate: "Iscrizione",
              id: "ID",
            }}
            server={{
              query,
              onQueryChange: setQuery,
              total,
              facetOptions: facets,
            }}
          />
        }
      />
    </EntityShell>
  );
}