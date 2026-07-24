"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";
import { cn } from "@/lib/utils";
import { Prisma, Purchase } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";

export type ProductWithSpec = Prisma.ProductGetPayload<{
	include: { membership: true; entranceSet: true };
}>;

export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
	amount: z.number().positive(),
	type: z.enum([ProductKind.Membership, ProductKind.EntranceSet]),
	productCode: z.string().min(1),
});

export const columns = (
	handleDelete: (purchase: Pick<Purchase, "id">) => Promise<void>,
	handleEdit: (purchase: Purchase) => Promise<void>,
	filteredProducts: ProductWithSpec[],
	onTypeChange: (type: ProductKind) => void
): ColumnDef<Purchase>[] => [
	{
		accessorKey: "clientId",
		header: ({ column }) => <TableSortableHeader column={column} title="Client ID" />,
	},
	{
		accessorKey: "date",
		header: ({ column }) => <TableSortableHeader column={column} title="Date" />,
		cell: ({ row }) => {
			const date = new Date(row.getValue("date"));
			return <div className="font-medium">{date.toLocaleDateString()}</div>;
		},
	},
	{
		accessorKey: "amount",
		header: ({ column }) => <TableSortableHeader column={column} title="Amount" />,
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("amount"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(amount);
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		id: "type",
		accessorFn: (row) => productKindFromSnapshot(row),
		header: ({ column }) => <TableSortableHeader column={column} title="Type" />,
		cell: ({ row }) => {
			const kind = productKindFromSnapshot(row.original);
			return <div>{PRODUCT_KIND_LABEL[kind]}</div>;
		},
		filterFn: (row, _id, value: string[]) => {
			const kind = productKindFromSnapshot(row.original);
			return value.includes(kind);
		},
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => <TableSortableHeader column={column} title="Product Code" />,
	},
	{
		accessorKey: "duration",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Durata (snapshot)" />
		),
		cell: ({ row }) => {
			const duration = row.getValue("duration") as number | null;
			return (
				<div className="text-muted-foreground">
					{duration != null ? `${duration} gg` : "—"}
				</div>
			);
		},
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="N ingressi (snapshot)" />
		),
		cell: ({ row }) => {
			const n = row.getValue("entranceNumber") as number | null;
			return <div className="text-muted-foreground">{n != null ? n : "—"}</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				editFormContent={
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
											disabled
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
													{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
						<FormField
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount</FormLabel>
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
						<FormField
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Type</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											onTypeChange(value as ProductKind);
										}}
										defaultValue={
											field.value ?? productKindFromSnapshot(row.original)
										}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(ProductKind).map((kind) => (
												<SelectItem key={kind} value={kind}>
													{PRODUCT_KIND_LABEL[kind]}
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
									<FormLabel>Product</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={filteredProducts.length === 0}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={
														filteredProducts.length === 0
															? "No products available for selected type"
															: "Select a product"
													}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{filteredProducts.map((product) => (
												<SelectItem key={product.code} value={product.code}>
													{product.code}
													{row.original.duration != null
														? ` (${product.membership?.duration} days)`
														: ` (${product.entranceSet?.entranceNumber} entrances)`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					const { type: _uiType, ...sale } = values;
					await handleEdit({
						...row.original,
						clientId: sale.clientId,
						date: sale.date,
						amount: sale.amount as unknown as Purchase["amount"],
						productCode: sale.productCode,
					});
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
