"use client";

import { TableCode } from "@/components/ui/data-table/table-cells";
import {
	DomainBadge,
	DotBadge,
	NumericCell,
} from "@/components/ui/domain-badge";
import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { OverflowText } from "@/components/ui/overflow-text";
import type { ProductListRow } from "@/data-access/products";
import { LONG_TEXT_COLUMN_SIZE } from "@/components/ui/data-table/table-column-layout";
import {
	missingKindBadgeSample,
	productKindBadgeSamples,
	productStatusBadgeSamples,
} from "@/components/ui/data-table/table-width-samples";
import { ColumnClass, ColumnWidth, columnMeta } from "@/lib/domain/column-class";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import { PRODUCT_KIND_ICON, PRODUCT_KIND_TONE } from "@/lib/domain/visual";
import { ColumnDef } from "@tanstack/react-table";
import { ATTR_ICON, ENTITY_ICON } from "@/lib/domain/icons";
import { Archive } from "lucide-react";
import { z } from "zod";
import { ProductFormFields } from "./product-form-fields";

export type ProductRow = ProductListRow;

export const formSchema = z.object({
	code: z.string().min(1, "Il codice prodotto è obbligatorio"),
	kind: z.enum([ProductKind.Membership, ProductKind.EntranceSet]),
	description: z
		.string()
		.trim()
		.min(1, "La descrizione è obbligatoria")
		.max(191, "La descrizione può contenere al massimo 191 caratteri"),
	detail: z
		.number()
		.int()
		.positive("Il valore deve essere un intero positivo"),
	active: z.boolean(),
});

export const columns = (
	handleDelete: (product: Pick<ProductRow, "code">) => Promise<void>,
	handleEdit: (product: z.infer<typeof formSchema>) => Promise<void>
): ColumnDef<ProductRow>[] => [
	{
		accessorKey: "code",
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Codice prodotto" icon={ENTITY_ICON.product} />
		),
		meta: columnMeta(ColumnClass.Native),
		cell: ({ row }) => (
			<TableCode value={row.original.code} filterKeys="code" />
		),
	},
	{
		accessorKey: "kind",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader column={column} title="Tipo" icon={ATTR_ICON.type} />
		),
		meta: columnMeta(ColumnClass.Derived, {
			width: ColumnWidth.Content,
			widthSamples: [...productKindBadgeSamples(), missingKindBadgeSample()],
		}),
		cell: ({ row }) => {
			const kind = row.original.kind;
			if (!kind) return <DomainBadge label="Configurazione mancante" tone="warning" />;
			return (
				<DotBadge
					label={PRODUCT_KIND_LABEL[kind]}
					icon={PRODUCT_KIND_ICON[kind]}
					tone={PRODUCT_KIND_TONE[kind]}
				/>
			);
		},
	},
	{
		accessorKey: "description",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Descrizione"
				icon={ATTR_ICON.description}
			/>
		),
		meta: columnMeta(ColumnClass.Native, { width: ColumnWidth.Text }),
		size: LONG_TEXT_COLUMN_SIZE,
		cell: ({ row }) => (
			<OverflowText>{row.original.description || "—"}</OverflowText>
		),
	},
	{
		accessorKey: "detail",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Dettagli"
				icon={ATTR_ICON.duration}
			/>
		),
		meta: columnMeta(ColumnClass.Derived),
		cell: ({ row }) => (
			<NumericCell muted>
				{row.original.detail == null
					? "—"
					: row.original.kind === ProductKind.Membership
						? `${row.original.detail} gg`
						: `${row.original.detail} ingressi`}
			</NumericCell>
		),
	},
	{
		accessorKey: "active",
		enableSorting: false,
		header: ({ column }) => (
			<TableSortableHeader
				column={column}
				title="Stato"
				icon={ATTR_ICON.approved}
			/>
		),
		meta: columnMeta(ColumnClass.Native, {
			width: ColumnWidth.Content,
			widthSamples: productStatusBadgeSamples(),
		}),
		cell: ({ row }) =>
			row.original.active ? (
				<DomainBadge
					label="Attivo"
					tone="success"
					icon={ATTR_ICON.approved}
				/>
			) : (
				<DomainBadge label="Archiviato" tone="muted" icon={Archive} />
			),
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<ItemActions
				row={row}
				formSchema={formSchema}
				entityLabel="Prodotto"
				deleteDescription="Se il Prodotto ha Vendite o voci di Listino collegati, l'eliminazione viene rifiutata (vincolo Restrict)."
				editDescription="Aggiorna descrizione, dettagli e disponibilità del Prodotto."
				editUnavailable={!row.original.kind}
				editFormContent={<ProductFormFields editing />}
				editAction={async ({ values }) => {
					await handleEdit(values);
				}}
				deleteAction={() => handleDelete({ code: row.original.code })}
			/>
		),
	},
];
