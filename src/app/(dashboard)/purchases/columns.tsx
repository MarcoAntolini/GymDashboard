"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Purchase, PurchaseType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";

export type PurchaseProductOption = {
	code: string;
	membership: { duration: number } | null;
	entranceSet: { entranceNumber: number } | null;
};

export type PurchaseRow = Purchase & {
	remainingEntrances: number | null;
};

/** Create/edit payload: no tipo; snapshot durata/N are set server-side and not editable. */
export const formSchema = z.object({
	clientId: z.number().int().positive(),
	date: z.date(),
	amount: z.number().positive(),
	productCode: z.string().min(1),
});

export const columns = (
	handleDelete: (purchase: Pick<Purchase, "id">) => Promise<void>,
	handleEdit: (purchase: PurchaseRow) => Promise<void>,
	filteredProducts: PurchaseProductOption[],
	onTypeChange: (type: PurchaseType) => void,
	filterType: PurchaseType
): ColumnDef<PurchaseRow>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => <TableSortableHeader column={column} title="ID" />,
	},
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
		accessorKey: "productCode",
		header: ({ column }) => <TableSortableHeader column={column} title="Product Code" />,
	},
	{
		accessorKey: "duration",
		header: ({ column }) => <TableSortableHeader column={column} title="Duration (snapshot)" />,
		cell: ({ row }) => {
			const duration = row.original.duration;
			return <div className="font-medium">{duration == null ? "—" : `${duration} days`}</div>;
		},
	},
	{
		accessorKey: "entranceNumber",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Entrances (snapshot)" />
		),
		cell: ({ row }) => {
			const n = row.original.entranceNumber;
			return <div className="font-medium">{n == null ? "—" : n}</div>;
		},
	},
	{
		accessorKey: "remainingEntrances",
		header: ({ column }) => <TableSortableHeader column={column} title="Remaining" />,
		cell: ({ row }) => {
			const remaining = row.original.remainingEntrances;
			return <div className="font-medium">{remaining == null ? "—" : remaining}</div>;
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
						<FormItem>
							<FormLabel>Product type filter</FormLabel>
							<Select
								onValueChange={(value) => onTypeChange(value as PurchaseType)}
								defaultValue={filterType}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Filter products by type" />
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
						</FormItem>
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
													{product.membership
														? ` (${product.membership.duration} days)`
														: ` (${product.entranceSet?.entranceNumber} entrances)`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Snapshot fields: read-only — not in formSchema / not submitted */}
						<FormItem>
							<FormLabel>Duration (sale snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.duration ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
						<FormItem>
							<FormLabel>Entrances (sale snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.entranceNumber ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
						<FormItem>
							<FormLabel>Remaining (from snapshot)</FormLabel>
							<FormControl>
								<Input value={row.original.remainingEntrances ?? "—"} disabled readOnly />
							</FormControl>
						</FormItem>
					</>
				}
				editAction={async ({ values }) => {
					const updatedPurchase = {
						...row.original,
						...values,
						amount: values.amount as unknown as PurchaseRow["amount"],
						// preserve immutable snapshots from the row
						duration: row.original.duration,
						entranceNumber: row.original.entranceNumber,
					} as PurchaseRow;
					await handleEdit(updatedPurchase);
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		),
	},
];
