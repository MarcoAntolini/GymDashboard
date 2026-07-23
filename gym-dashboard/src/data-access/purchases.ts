"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult
} from "@/lib/list-query";
import { purchaseSnapshotsFromProduct } from "@/lib/purchase-snapshots";
import { Prisma, Purchase, PurchaseType } from "@prisma/client";

type PurchaseAmount = Prisma.Decimal | string | number;

type PurchaseCreate = {
	clientId: number;
	date: Date;
	productCode: string;
	amount?: PurchaseAmount;
};

type PurchaseUpdate = {
	id: number;
	clientId: number;
	date: Date;
	productCode: string;
	amount: PurchaseAmount;
};

const purchaseInclude = {
	client: true,
	prodotto: {
		include: {
			membership: true,
			entranceSet: true
		}
	},
	_count: {
		select: { entrances: true }
	}
} as const;

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{ include: typeof purchaseInclude }>;

export type PurchaseDTO = Omit<PurchaseWithRelations, "amount" | "_count"> & {
	amount: number;
	/** Anno di Listino usato come riferimento snapshot (dalla data Acquisto). */
	listinoYear: number;
	/** Ingressi già collegati a questo Acquisto. */
	usedEntrances: number;
	/**
	 * Residuo pacchetto derivato `N − COUNT` usando lo snapshot N sull'Acquisto;
	 * `null` per Abbonamento. Non è un attributo del Cliente.
	 */
	remainingEntrances: number | null;
};

function toDecimal(amount: PurchaseAmount): Prisma.Decimal {
	return amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
}

function serializePurchase(purchase: PurchaseWithRelations): PurchaseDTO {
	const usedEntrances = purchase._count.entrances;
	const entranceNumber = purchase.entranceNumber;
	const { _count: _ignored, ...rest } = purchase;

	return {
		...rest,
		amount: Number(purchase.amount),
		listinoYear: purchase.date.getFullYear(),
		usedEntrances,
		remainingEntrances:
			entranceNumber != null ? entranceNumber - usedEntrances : null
	};
}

async function resolveSnapshotAmount(
	date: Date,
	productCode: string,
	amount?: PurchaseAmount
): Promise<Prisma.Decimal> {
	if (amount !== undefined && amount !== null && String(amount).trim() !== "") {
		return toDecimal(amount);
	}

	const year = date.getFullYear();
	const catalog = await db.catalog.findUnique({
		where: {
			year_productCode: {
				year,
				productCode
			}
		}
	});

	if (!catalog) {
		throw new Error(
			`Nessun prezzo Listino per il Prodotto ${productCode} nell'anno ${year}. Specificare un importo.`
		);
	}

	return catalog.price;
}

async function resolveCapabilitySnapshots(productCode: string) {
	const product = await db.product.findUnique({
		where: { code: productCode },
		include: {
			membership: true,
			entranceSet: true
		}
	});

	if (!product) {
		throw new Error(`Prodotto ${productCode} non trovato.`);
	}

	return purchaseSnapshotsFromProduct({
		membership: product.membership,
		entranceSet: product.entranceSet
	});
}

export async function createPurchase({
	clientId,
	date,
	productCode,
	amount
}: PurchaseCreate): Promise<PurchaseDTO> {
	await requireRole("Employee");
	const snapshotAmount = await resolveSnapshotAmount(date, productCode, amount);
	const capabilitySnapshots = await resolveCapabilitySnapshots(productCode);

	const purchase = await db.purchase.create({
		data: {
			clientId,
			date,
			amount: snapshotAmount,
			productCode,
			membershipDuration: capabilitySnapshots.membershipDuration,
			entranceNumber: capabilitySnapshots.entranceNumber
		},
		include: purchaseInclude
	});
	return serializePurchase(purchase);
}

/**
 * `client` search = OR on Cliente name/surname (and numeric id if the query is an int).
 * Documented mapping: UI column `client` → Prisma `client` relation filters.
 */
function clientNameWhere(value: string): Prisma.PurchaseWhereInput {
	const or: Prisma.PurchaseWhereInput[] = [
		{ client: { is: { surname: { contains: value } } } },
		{ client: { is: { name: { contains: value } } } }
	];
	const asId = Number(value.replace(/^#/, "").trim());
	if (Number.isInteger(asId) && asId > 0) {
		or.push({ clientId: asId });
	}
	return { OR: or };
}

/**
 * Kind filter uses Purchase capability snapshots (membershipDuration / entranceNumber),
 * not live Product relations — residual/validity stay coherent with what was sold.
 */
function kindWhere(values: string[]): Prisma.PurchaseWhereInput | undefined {
	const clauses: Prisma.PurchaseWhereInput[] = [];
	if (
		values.includes(PurchaseType.Membership) ||
		values.includes("Abbonamento") ||
		values.includes("Membership")
	) {
		clauses.push({ membershipDuration: { not: null } });
	}
	if (
		values.includes(PurchaseType.EntranceSet) ||
		values.includes("Pacchetto") ||
		values.includes("Pacchetto ingressi") ||
		values.includes("EntranceSet")
	) {
		clauses.push({ entranceNumber: { not: null } });
	}
	if (clauses.length === 0) return undefined;
	if (clauses.length === 1) return clauses[0];
	return { OR: clauses };
}

const purchaseFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.PurchaseWhereInput | undefined>
> = {
	client: (filter) => {
		const value = textContains(filter);
		return value ? clientNameWhere(value) : undefined;
	},
	productCode: (filter) => {
		const value = textContains(filter);
		return value ? { productCode: { contains: value } } : undefined;
	},
	kind: (filter) => {
		const values = enumValues(filter);
		return values ? kindWhere(values) : undefined;
	}
};

const purchaseSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.PurchaseOrderByWithRelationInput>
> = {
	client: (desc) => ({ client: { surname: desc ? "desc" : "asc" } }),
	date: (desc) => ({ date: desc ? "desc" : "asc" }),
	productCode: (desc) => ({ productCode: desc ? "desc" : "asc" }),
	amount: (desc) => ({ amount: desc ? "desc" : "asc" }),
	id: (desc) => ({ id: desc ? "desc" : "asc" }),
	// Snapshot columns — sort on the underlying snapshot fields.
	kind: (desc) => ({ membershipDuration: desc ? "desc" : "asc" }),
	capabilitySnapshot: (desc) => ({ membershipDuration: desc ? "desc" : "asc" }),
	remainingEntrances: (desc) => ({ entranceNumber: desc ? "desc" : "asc" })
};

async function loadPurchaseFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const whereWithoutKind = buildWhere(filters, purchaseFilterMap, { exclude: "kind" });

	const [membershipCount, entranceSetCount] = await Promise.all([
		db.purchase.count({
			where: whereWithoutKind
				? { AND: [whereWithoutKind, { membershipDuration: { not: null } }] }
				: { membershipDuration: { not: null } }
		}),
		db.purchase.count({
			where: whereWithoutKind
				? { AND: [whereWithoutKind, { entranceNumber: { not: null } }] }
				: { entranceNumber: { not: null } }
		})
	]);

	// Facet values match the Italian labels shown by the `kind` column accessor.
	return {
		kind: [
			{ value: "Abbonamento", count: membershipCount },
			{ value: "Pacchetto", count: entranceSetCount }
		].filter((option) => option.count > 0)
	};
}

/** Server-paginated/filtered purchase list (client join + kind via snapshots). */
export async function listPurchases(rawQuery: ListQuery): Promise<ListResult<PurchaseDTO>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, purchaseFilterMap);
	const orderBy = resolveOrderBy(query.sort, purchaseSortMap, { date: "desc" });

	const [total, items, facets] = await Promise.all([
		db.purchase.count({ where }),
		db.purchase.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: purchaseInclude
		}),
		loadPurchaseFacets(query.filters)
	]);

	return {
		items: items.map(serializePurchase),
		total,
		facets
	};
}

export async function getPurchase(id: number): Promise<PurchaseDTO | null> {
	await requireRole("Employee");
	const purchase = await db.purchase.findUnique({
		where: {
			id
		},
		include: purchaseInclude
	});
	return purchase ? serializePurchase(purchase) : null;
}

export async function editPurchase({
	id,
	clientId,
	date,
	productCode,
	amount
}: PurchaseUpdate): Promise<PurchaseDTO> {
	await requireRole("Employee");
	const existing = await db.purchase.findUnique({ where: { id } });
	if (!existing) {
		throw new Error("Acquisto non trovato.");
	}

	// Snapshot durata/N: ripopolati solo se cambia il Prodotto (nuova vendita logica).
	// Altrimenti restano i valori fissati alla vendita originale.
	const capabilitySnapshots =
		existing.productCode === productCode
			? {
					membershipDuration: existing.membershipDuration,
					entranceNumber: existing.entranceNumber
				}
			: await resolveCapabilitySnapshots(productCode);

	const purchase = await db.purchase.update({
		where: {
			id
		},
		data: {
			clientId,
			date,
			productCode,
			amount: toDecimal(amount),
			membershipDuration: capabilitySnapshots.membershipDuration,
			entranceNumber: capabilitySnapshots.entranceNumber
		},
		include: purchaseInclude
	});
	return serializePurchase(purchase);
}

export async function deletePurchase({ id }: Pick<Purchase, "id">) {
	await requireRole("Employee");
	try {
		const purchase = await db.purchase.delete({
			where: {
				id
			},
			include: purchaseInclude
		});
		return serializePurchase(purchase);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			(error.code === "P2003" || error.code === "P2014")
		) {
			throw new Error(
				"Impossibile eliminare questo Acquisto: ha Ingressi collegati. Elimina prima gli Ingressi."
			);
		}
		throw error;
	}
}
