"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createProduct, deleteProduct, editProduct, getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import { Product } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";

export default function ProductsPage() {
  const {
    data: products,
    setData: setProducts,
    isLoading,
    handleDelete,
    handleEdit,
  } = useEntityData<Product, "code">(
    useMemo(
      () => ({
        getAll: getAllProducts,
        deleteAction: deleteProduct,
        editAction: editProduct,
      }),
      []
    ),
    ["code"]
  );

  const handleCreateProduct = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const newProduct = await createProduct(values);
      setProducts((prevProducts) => [...prevProducts, newProduct]);
    },
    [setProducts]
  );

  const actions: Action[] = [
    {
      title: "Add Product",
      icon: PlusCircle,
      dialogContent: (
        <>
          <FormField
            name="code"
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
      ),
      formData: {
        formSchema,
        defaultValues: {
          code: "",
        },
        submitAction: handleCreateProduct,
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
          data={products}
          filters={["code"]}
        />
      }
    />
  );
}