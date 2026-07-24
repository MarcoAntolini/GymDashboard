"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import { ServerDataTable } from "@/components/ui/data-table/server-data-table";
import type { ServerListFilterField } from "@/components/ui/data-table/server-list-toolbar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createClient,
	deleteClient,
	editClient,
	listClients,
	type ClientListResult,
} from "@/data-access/clients";
import {
	CLIENT_LIST_DEFAULT_SORT,
	CLIENT_LIST_FILTER_IDS,
	CLIENT_LIST_SORT_COLUMNS,
} from "@/lib/domain/client-list-query";
import { useServerListQuery } from "@/hooks/useServerListQuery";
import { DATASET_EMPTY_MESSAGES } from "@/lib/format/table-empty";
import { Client } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CLIENT_FILTER_FIELDS: ServerListFilterField[] = [
	{ id: "taxCode", label: "Codice fiscale", placeholder: "Codice fiscale" },
	{ id: "surname", label: "Cognome", placeholder: "Cognome" },
	{ id: "name", label: "Nome", placeholder: "Nome" },
	{ id: "city", label: "Città", placeholder: "Città" },
	{ id: "province", label: "Provincia", placeholder: "Provincia" },
];

const EMPTY_FILTERS = Object.fromEntries(
	CLIENT_LIST_FILTER_IDS.map((id) => [id, ""])
) as Record<(typeof CLIENT_LIST_FILTER_IDS)[number], string>;

export default function ClientsPage() {
	const listQuery = useServerListQuery({
		allowedSortColumns: CLIENT_LIST_SORT_COLUMNS,
		defaultSort: CLIENT_LIST_DEFAULT_SORT,
		initialFilters: EMPTY_FILTERS,
	});

	const [result, setResult] = useState<ClientListResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchList = useCallback(async () => {
		setIsLoading(true);
		try {
			const next = await listClients(listQuery.input);
			setResult(next);
		} finally {
			setIsLoading(false);
		}
	}, [listQuery.input]);

	useEffect(() => {
		void fetchList();
	}, [fetchList]);

	const handleDelete = useCallback(
		async (client: Pick<Client, "id">) => {
			await deleteClient(client);
			await fetchList();
		},
		[fetchList]
	);

	const handleEdit = useCallback(
		async (client: Client) => {
			await editClient(client);
			await fetchList();
		},
		[fetchList]
	);

	const handleCreateClient = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createClient(values);
			await fetchList();
		},
		[fetchList]
	);

	const tableColumns = useMemo(
		() => columns(handleDelete, handleEdit),
		[handleDelete, handleEdit]
	);

	const actions: Action[] = [
		{
			title: "Add Client",
			icon: PlusCircle,
			dialogContent: (
				<>
					<div className="grid grid-cols-2 gap-4">
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
					</div>
					<div className="grid grid-cols-2 gap-4">
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
							name="birthDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Birth Date</FormLabel>
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
														format(field.value, "PPP")
													) : (
														<span>Pick a date</span>
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
									<FormLabel>Street</FormLabel>
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
									<FormLabel>Number</FormLabel>
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
									<FormLabel>City</FormLabel>
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
									<FormLabel>Province</FormLabel>
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
									<FormLabel>Phone Number</FormLabel>
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
								<FormLabel>Enrollment Date</FormLabel>
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
													format(field.value, "PPP")
												) : (
													<span>Pick a date</span>
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

	const showPlaceholder = isLoading && result === null;

	return showPlaceholder ? (
		<DashboardPlaceholder />
	) : (
		<Dashboard
			actions={actions}
			table={
				<ServerDataTable
					columns={tableColumns}
					data={result?.rows ?? []}
					total={result?.total ?? 0}
					page={listQuery.page}
					pageSize={listQuery.pageSize}
					pageCount={result?.pageCount ?? 0}
					sort={listQuery.sort}
					onSortChange={listQuery.setSort}
					onPageChange={listQuery.setPage}
					onPageSizeChange={listQuery.setPageSize}
					filterFields={CLIENT_FILTER_FIELDS}
					draftFilters={listQuery.draftFilters}
					onDraftFilterChange={listQuery.setDraftFilter}
					onApplyFilters={listQuery.applyFilters}
					onResetFilters={listQuery.resetFilters}
					isFilterDirty={listQuery.isFilterDirty}
					hasAppliedFilters={listQuery.hasAppliedFilters}
					emptyKind={result?.emptyKind ?? null}
					datasetEmptyMessage={DATASET_EMPTY_MESSAGES.clienti}
				/>
			}
		/>
	);
}
