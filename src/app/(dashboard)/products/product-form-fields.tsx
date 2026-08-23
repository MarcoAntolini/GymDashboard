"use client";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import { useFormContext, useWatch } from "react-hook-form";

export function ProductFormFields({ editing = false }: { editing?: boolean }) {
	const form = useFormContext();
	const kind = useWatch({ control: form.control, name: "kind" }) as ProductKind;
	const detailLabel =
		kind === ProductKind.EntranceSet
			? "Numero ingressi"
			: "Durata (giorni)";

	return (
		<>
			<FormField
				control={form.control}
				name="code"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Codice prodotto</FormLabel>
						<FormControl>
							<Input {...field} disabled={editing} />
						</FormControl>
						{editing ? (
							<FormDescription>
								Il codice identifica il prodotto e non può essere modificato.
							</FormDescription>
						) : null}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="kind"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Tipo</FormLabel>
						<Select
							value={field.value}
							onValueChange={field.onChange}
							disabled={editing}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Seleziona un tipo" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value={ProductKind.Membership}>
									{PRODUCT_KIND_LABEL[ProductKind.Membership]}
								</SelectItem>
								<SelectItem value={ProductKind.EntranceSet}>
									{PRODUCT_KIND_LABEL[ProductKind.EntranceSet]}
								</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Descrizione</FormLabel>
						<FormControl>
							<Input
								{...field}
								placeholder="Es. Abbonamento mensile"
								maxLength={191}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="detail"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{detailLabel}</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1}
								className="text-right tabular-nums"
								{...field}
								onChange={(event) =>
									field.onChange(Number.parseInt(event.target.value, 10))
								}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="active"
				render={({ field }) => (
					<FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
						<div className="space-y-1">
							<FormLabel>Prodotto attivo</FormLabel>
							<FormDescription>
								I prodotti archiviati restano nello storico ma non sono vendibili.
							</FormDescription>
						</div>
						<FormControl>
							<Switch
								checked={field.value}
								onCheckedChange={field.onChange}
								aria-label="Prodotto attivo"
							/>
						</FormControl>
					</FormItem>
				)}
			/>
		</>
	);
}
