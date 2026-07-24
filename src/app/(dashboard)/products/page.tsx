"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteProduct, editProduct, getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import { useMemo } from "react";
import { columns, type ProductRow } from "./columns";

export default function ProductsPage() {
	const {
		data: products,
		isLoading,
		handleDelete,
		handleEdit,
	} = useEntityData<ProductRow, "code">(
		useMemo(
			() => ({
				getAll: getAllProducts,
				deleteAction: async (key) => {
					await deleteProduct(key);
					return key as ProductRow;
				},
				editAction: async (product) => {
					const updated = await editProduct({ code: product.code });
					return { ...product, code: updated.code };
				},
			}),
			[]
		),
		["code"]
	);

	return isLoading ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={[]}
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
