"use client";

import Dashboard, { Action, FormData } from "@/components/ui/dashboard";
import { DataTable } from "@/components/ui/data-table";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createClient,
	deleteClient,
	editClient,
	listClients,
} from "@/data-access/clients";
import { useServerList } from "@/hooks/useServerList";
import {
	CLIENT_DEFAULT_SORT,
	CLIENT_FILTER_ALLOWLIST,
	CLIENT_SORT_ALLOWLIST,
	CLIENT_FILTER_LABELS,
} from "@/lib/list/clients";
import { Client } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { columns, formSchema } from "./columns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatDateIt } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
	const list = useServerList<Client>({
		list: listClients,
		sortAllowlist: CLIENT_SORT_ALLOWLIST,
		filterAllowlist: CLIENT_FILTER_ALLOWLIST,
		defaultSort: [...CLIENT_DEFAULT_SORT],
	});
	const { refetch, setItems } = list;

	const handleDelete = useCallback(
		async (client: Pick<Client, "id">) => {
			await deleteClient(client);
			refetch();
		},
		[refetch]
	);

	const handleEdit = useCallback(
		async (client: Client) => {
			const updated = await editClient(client);
			setItems((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item))
			);
		},
		[setItems]
	);

	const handleCreateClient = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			await createClient(values);
			refetch();
		},
		[refetch]
	);

	const actions: Action[] = [
		{
			title: "Aggiungi cliente",
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
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="enrollmentDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data iscrizione</FormLabel>
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
					</div>
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
		<Dashboard
			actions={actions}
			table={
				<DataTable
					columns={columns(handleDelete, handleEdit)}
					getRowId={(row) => String(row.id)}
					entityLabel="Cliente"
					bulkDeleteRow={async (row) => {
						await deleteClient({ id: row.id });
					}}
					onBulkComplete={refetch}
					data={list.items}
					isLoading={list.isLoading}
					error={list.error}
					onRetry={list.refetch}
					filters={["taxCode", "name", "surname", "city", "province"]}
					filterLabels={CLIENT_FILTER_LABELS}
					emptyState={
						<TableEmptyState
							title="Nessun cliente"
							hint="Usa Aggiungi cliente per registrare il primo Cliente."
						/>
					}
					serverList={{
						manual: true,
						pageCount: list.pageCount,
						rowCount: list.total,
						sorting: list.sorting,
						onSortingChange: list.onSortingChange,
						pagination: list.pagination,
						onPaginationChange: list.onPaginationChange,
						draftFilters: list.draftFilters,
						onDraftFilterChange: list.setDraftFilter,
						onApplyFilters: list.applyFilters,
						onResetFilters: list.resetFilters,
						filtersDirty: list.filtersDirty,
						appliedFilters: list.query.filters,
					}}
				/>
			}
		/>
	);
}
