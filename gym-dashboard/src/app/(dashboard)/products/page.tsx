"use client";

import Dashboard from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { DataTable } from "@/components/ui/data-table";
import { deleteProduct, editProduct, getAllProducts } from "@/data-access/products";
import { useEntityData } from "@/hooks/useEntityData";
import { Product } from "@prisma/client";
import { useMemo } from "react";
import { columns } from "./columns";

export default function ProductsPage() {
	const {
		data: products,
		isLoading,
		handleDelete,
		handleEdit
	} = useEntityData<Product, "code">(
		useMemo(
			() => ({
				getAll: getAllProducts,
				deleteAction: deleteProduct,
				editAction: editProduct
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
			table={<DataTable columns={columns(handleDelete, handleEdit)} data={products} filters={["code"]} />}
		/>
	);
}
