"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import {
	MoneyTone,
	ProductKindBadge,
	RemainingEntrancesBadge,
	type ProductKindKey,
} from "@/components/ui/domain-badge";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PurchaseDTO } from "@/data-access/purchases";
import { cn } from "@/lib/utils";
import { EntranceSet, Membership, Product } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
	Banknote,
	CalendarDays,
	CalendarIcon,
	Hash,
	Package,
	Shapes,
	Ticket,
	Timer,
	UserRound,
} from "lucide-react";
import { z } from "zod";
import { formatCurrencyEur, formatDateIt, personLabel } from "@/lib/format";

export const ProductKind = {
	Membership: "Membership",
	EntranceSet: "EntranceSet"
} as const;

export type ProductKind = (typeof ProductKind)[keyof typeof ProductKind];

export const productKindLabel: Record<ProductKind, string> = {
	[ProductKind.Membership]: "Abbonamento",
	[ProductKind.EntranceSet]: "Pacchetto"
};

export type ProductWithKind = Product & {
	membership: Membership | null;
	entranceSet: EntranceSet | null;
};

export type PurchaseRow = PurchaseDTO;

export const formSchema = z.object({
	clientId: z.number().int().positive("Seleziona un Cliente"),
	date: z.date({ required_error: "La data è obbligatoria." }),
	amount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "L'importo può avere al massimo 2 decimali")
		.refine((value) => Number(value) > 0, "L'importo deve essere positivo"),
	productCode: z.string().min(1, "Seleziona un Prodotto")
});

function formatAmount(amount: unknown): string {
	return formatCurrencyEur(amount);
}

function amountToFormString(amount: unknown): string {
	const value =
		typeof amount === "string" || typeof amount === "number" ? Number(amount) : Number(String(amount));
	return value.toFixed(2);
}

function productKindOf(purchase: PurchaseRow): ProductKindKey | null {
	if (purchase.membershipDuration != null || purchase.prodotto?.membership) {
		return ProductKind.Membership;
	}
	if (purchase.entranceNumber != null || purchase.prodotto?.entranceSet) {
		return ProductKind.EntranceSet;
	}
	return null;
}

function productKindLabelOf(purchase: PurchaseRow): string {
	const kind = productKindOf(purchase);
	if (!kind) return "—";
	return productKindLabel[kind];
}

function clientNameOf(purchase: PurchaseRow): string {
	return personLabel(purchase.client);
}

export const columns = (
	handleDelete: (purchase: Pick<PurchaseDTO, "id">) => Promise<void>,
	handleEdit: (purchase: PurchaseDTO) => Promise<void>,
	filteredProducts: ProductWithKind[],
	selectedType: ProductKind,
	onTypeChange: (type: ProductKind) => void
): ColumnDef<PurchaseRow>[] => [
	{
		id: "client",
		accessorFn: (row) => clientNameOf(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Cliente" icon={UserRound} />
		),
		cell: ({ row }) => <div>{clientNameOf(row.original)}</div>
	},
	{
		accessorKey: "date",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Data" icon={CalendarDays} />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{formatDateIt(row.getValue("date"))}</div>;
		}
	},
	{
		id: "kind",
		accessorFn: (row) => productKindLabelOf(row),
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={Shapes} />
		),
		cell: ({ row }) => <ProductKindBadge kind={productKindOf(row.original)} />
	},
	{
		accessorKey: "productCode",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Prodotto" icon={Package} />
		)
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Importo (snapshot)" icon={Banknote} />
		),
		cell: ({ row }) => (
			<div
				className="font-medium"
				title={`Snapshot alla vendita · riferimento Listino ${row.original.listinoYear}`}
			>
				<MoneyTone amount={Number(row.getValue("amount"))} direction="income">
					{formatAmount(row.getValue("amount"))}
				</MoneyTone>
				<span className="ml-1 text-xs font-normal text-muted-foreground">
					· Listino {row.original.listinoYear}
				</span>
			</div>
		)
	},
	{
		id: "capabilitySnapshot",
		accessorFn: (row) => {
			if (row.membershipDuration != null) return `${row.membershipDuration} giorni`;
			if (row.entranceNumber != null) return `${row.entranceNumber} ingressi`;
			return "—";
		},
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Durata / N (snapshot)" icon={Timer} />
		),
		cell: ({ row }) => {
			const { membershipDuration, entranceNumber } = row.original;
			if (membershipDuration != null) {
				return (
					<div
						className="tabular-nums"
						title="Durata Abbonamento fissata alla vendita; modifiche al Prodotto non la aggiornano"
					>
						{membershipDuration} giorni
					</div>
				);
			}
			if (entranceNumber != null) {
				return (
					<div
						className="tabular-nums"
						title="N ingressi Pacchetto fissato alla vendita; modifiche al Prodotto non lo aggiornano"
					>
						{entranceNumber} ingressi
					</div>
				);
			}
			return <div className="text-muted-foreground">—</div>;
		}
	},
	{
		id: "remainingEntrances",
		accessorFn: (row) =>
			row.remainingEntrances != null ? String(row.remainingEntrances) : "—",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Ingressi rimanenti" icon={Ticket} />
		),
		cell: ({ row }) => {
			const remaining = row.original.remainingEntrances;
			if (remaining == null) {
				return (
					<div className="text-muted-foreground" title="Solo per Acquisti di Pacchetto">
						—
					</div>
				);
			}
			const total = row.original.entranceNumber;
			return <RemainingEntrancesBadge remaining={remaining} total={total ?? undefined} />;
		}
	},
	{
		accessorKey: "id",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="ID" icon={Hash} />
		)
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={{
					...row,
					original: {
						...row.original,
						amount: amountToFormString(row.original.amount)
					}
				}}
				formSchema={formSchema}
				entityLabel="Acquisto"
				deleteDescription="Se l'Acquisto ha Ingressi collegati, l'eliminazione viene rifiutata (vincolo Restrict): elimina prima gli Ingressi. L'operazione non può essere annullata."
				editFormContent={
					<>
						{(row.original.membershipDuration != null ||
							row.original.entranceNumber != null) && (
							<div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-pretty">
								{row.original.membershipDuration != null ? (
									<>
										Durata Abbonamento (snapshot alla vendita):{" "}
										<span className="font-medium tabular-nums">
											{row.original.membershipDuration} giorni
										</span>
										. Modifiche al Prodotto non aggiornano questo titolo.
									</>
								) : (
									<>
										N ingressi Pacchetto (snapshot alla vendita):{" "}
										<span className="font-medium tabular-nums">
											{row.original.entranceNumber}
										</span>
										. Residuo su questo Acquisto:{" "}
										<span className="font-medium tabular-nums">
											{row.original.remainingEntrances ?? "—"} /{" "}
											{row.original.entranceNumber}
										</span>{" "}
										(derivato, non sul Cliente).
									</>
								)}
							</div>
						)}
						<FormField
							name="clientId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Cliente</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											onChange={(e) => field.onChange(parseInt(e.target.value))}
											disabled
										/>
									</FormControl>
									<p className="text-sm text-muted-foreground">{clientNameOf(row.original)}</p>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Data</FormLabel>
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
													{field.value ? formatDateIt(field.value) : <span>Scegli una data</span>}
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
									<p className="text-sm text-muted-foreground">
										Anno Listino di riferimento:{" "}
										<span className="tabular-nums">
											{field.value instanceof Date
												? field.value.getFullYear()
												: row.original.listinoYear}
										</span>
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Selettore tipo: solo filtro UI su Prodotti (membership XOR entranceSet) */}
						<div className="flex flex-col gap-2">
							<Label>Tipo</Label>
							<Select
								value={selectedType}
								onValueChange={(value) => onTypeChange(value as ProductKind)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleziona un tipo" />
								</SelectTrigger>
								<SelectContent>
									{(Object.keys(ProductKind) as ProductKind[]).map((type) => (
										<SelectItem key={type} value={type}>
											{productKindLabel[type]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<FormField
							name="productCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Prodotto</FormLabel>
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
															? "Nessun prodotto disponibile per il tipo selezionato"
															: "Seleziona un prodotto"
													}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{filteredProducts.map((product) => (
												<SelectItem key={product.code} value={product.code}>
													{product.code}{" "}
													{selectedType === ProductKind.Membership
														? `(${product.membership?.duration} giorni)`
														: `(${product.entranceSet?.entranceNumber} ingressi)`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Importo (snapshot)</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											{...field}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<p className="text-sm text-muted-foreground">
										Importo fissato alla vendita; modifiche successive al Listino non lo
										aggiornano.
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				}
				editAction={async ({ values }) => {
					await handleEdit({
						...row.original,
						date: values.date,
						productCode: values.productCode,
						amount: Number(values.amount)
					});
				}}
				deleteAction={() => handleDelete({ id: row.original.id })}
			/>
		)
	}
];
