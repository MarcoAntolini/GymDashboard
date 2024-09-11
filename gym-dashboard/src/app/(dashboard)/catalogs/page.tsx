"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCatalog, deleteCatalog, editCatalog, getAllCatalogs } from "@/data-access/catalogs";
import { useEntityData } from "@/hooks/useEntityData";
import { Catalog, PurchaseType } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function CatalogsPage() {
  const {
    data: catalogs,
    setData: setCatalogs,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Catalog, "year" | "type" | "productCode">(
    useMemo(
      () => ({
        getAll: getAllCatalogs,
        deleteAction: deleteCatalog,
        editAction: editCatalog,
      }),
      []
    ),
    ["year", "type", "productCode"]
  );

  const handleCreateCatalog = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newCatalog = await createCatalog(values);
      setCatalogs((prevCatalogs) => [...prevCatalogs, newCatalog]);
    },
    [setCatalogs]
  );

  const actions: Action[] = [
    {
      title: "Add Catalog",
      icon: PlusCircle,
      dialogContent: (
        <>
          <FormField
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
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
          <FormField
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
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
        </>
      ),
      formData: {
        formSchema,
        defaultValues: {
          year: new Date().getFullYear(),
          type: PurchaseType.Membership,
          productCode: "",
          price: 0,
        },
        submitAction: handleCreateCatalog,
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
          data={catalogs}
          filters={["year", "type", "productCode"]}
          facetedFilters={["year", "type"]}
        />
      }
    />
  );
}