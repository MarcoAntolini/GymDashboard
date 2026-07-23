"use client";

import Dashboard from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import {
	deleteProduct,
	editProduct,
	listProducts,
	type ProductDTO,
} from "@/data-access/products";
import { useEntityList } from "@/hooks/useEntityList";
import { useMemo } from "react";
import { columns } from "./columns";

export default function ProductsPage() {
	const {
		data: products,
		total,
		facets,
		query,
		setQuery,
		handleDelete,
		handleEdit,
	} = useEntityList<ProductDTO, "code">(
		useMemo(
			() => ({
				list: listProducts,
				deleteAction: deleteProduct,
				editAction: editProduct,
			}),
			[]
		),
		["code"]
	);

	return (
		<Dashboard
			actions={[]}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					data={products}
					filters={["code"]}
					facetedFilters={["kind"]}
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
