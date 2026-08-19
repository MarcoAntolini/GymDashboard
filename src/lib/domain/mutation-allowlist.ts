/**
 * Allowlist campi editabili per mutazioni create/update (ticket 11).
 * Allineata a `docs/domain/04-viste-colonne.md` e `docs/domain/05-mutazioni-allowlist.md`.
 *
 * join / derived / snapshot immutabili non entrano nei payload accettati.
 */

export type MutationOp = "create" | "update";

export type FieldMutationPolicy = {
	/** Accettato in create. */
	create?: boolean;
	/** Accettato in update (incluso locator PK dove serve). */
	update?: boolean;
	/** Se presente nel payload → errore (snapshot/derived/server-owned). */
	immutable?: boolean;
	/** Join/proiezione di lettura: strip silenzioso, non scritto. */
	strip?: boolean;
	/** Solo Admin+ quando create/update sono true. */
	adminOnly?: boolean;
	/** Accettato in scrittura; non va esposto in lettura. */
	writeOnly?: boolean;
};

export type EntityMutationKey =
	| "client"
	| "employee"
	| "account"
	| "contract"
	| "clocking"
	| "product"
	| "membership"
	| "entranceSet"
	| "catalog"
	| "sale"
	| "entrance"
	| "payment"
	| "salary"
	| "bill"
	| "equipment"
	| "intervention";

export const MUTATION_ALLOWLIST = {
	client: {
		id: { update: true },
		taxCode: { create: true, update: true },
		name: { create: true, update: true },
		surname: { create: true, update: true },
		birthDate: { create: true, update: true },
		street: { create: true, update: true },
		houseNumber: { create: true, update: true },
		city: { create: true, update: true },
		province: { create: true, update: true },
		phoneNumber: { create: true, update: true },
		email: { create: true, update: true },
		enrollmentDate: { create: true, update: true },
		remainingEntrances: { immutable: true },
	},
	employee: {
		id: { update: true },
		taxCode: { create: true, update: true },
		name: { create: true, update: true },
		surname: { create: true, update: true },
		birthDate: { create: true, update: true },
		street: { create: true, update: true },
		houseNumber: { create: true, update: true },
		city: { create: true, update: true },
		province: { create: true, update: true },
		phoneNumber: { create: true, update: true },
		email: { create: true, update: true },
		hiringDate: { create: true, update: true },
	},
	account: {
		username: { create: true },
		password: { create: true, writeOnly: true },
		employeeId: { create: true, update: true },
		role: { update: true, adminOnly: true },
		approved: { update: true, adminOnly: true },
		employee: { strip: true },
	},
	contract: {
		employeeId: { create: true, update: true },
		startingDate: { create: true, update: true },
		type: { create: true, update: true },
		hourlyFee: { create: true, update: true },
		endingDate: { create: true, update: true },
	},
	clocking: {
		employeeId: { create: true, update: true },
		entranceTime: { create: true, update: true },
		exitTime: { create: true, update: true },
	},
	product: {
		code: { create: true, update: true },
		type: { immutable: true },
		kind: { immutable: true },
		membership: { strip: true },
		entranceSet: { strip: true },
	},
	membership: {
		productCode: { create: true, update: true },
		duration: { create: true, update: true },
		product: { strip: true },
		type: { immutable: true },
	},
	entranceSet: {
		productCode: { create: true, update: true },
		entranceNumber: { create: true, update: true },
		product: { strip: true },
		type: { immutable: true },
	},
	catalog: {
		year: { create: true, update: true },
		productCode: { create: true, update: true },
		price: { create: true, update: true },
		type: { immutable: true },
		product: { strip: true },
	},
	sale: {
		id: { update: true },
		clientId: { create: true, update: true },
		date: { create: true, update: true },
		amount: { create: true, update: true },
		productCode: { create: true, update: true },
		duration: { immutable: true },
		entranceNumber: { immutable: true },
		type: { immutable: true },
		kind: { immutable: true },
		client: { strip: true },
		prodotto: { strip: true },
		product: { strip: true },
	},
	entrance: {
		id: { update: true },
		clientId: { create: true },
		date: { create: true, update: true },
		saleId: { immutable: true },
		client: { strip: true },
		product: { strip: true },
		prodotto: { strip: true },
		sale: { strip: true },
		packageResidual: { immutable: true },
	},
	payment: {
		id: { update: true },
		date: { create: true, update: true },
		amount: { create: true, update: true },
		type: { create: true, update: true },
		employeeId: { create: true },
		description: { create: true },
		provider: { create: true },
		maker: { create: true },
		startingTime: { create: true },
		endingTime: { create: true },
		salary: { strip: true },
		bill: { strip: true },
		equipment: { strip: true },
		intervention: { strip: true },
	},
	salary: {
		paymentId: { create: true, update: true },
		employeeId: { create: true, update: true },
		payment: { strip: true },
		employee: { strip: true },
	},
	bill: {
		paymentId: { create: true, update: true },
		description: { create: true, update: true },
		provider: { create: true, update: true },
		payment: { strip: true },
	},
	equipment: {
		paymentId: { create: true, update: true },
		description: { create: true, update: true },
		provider: { create: true, update: true },
		payment: { strip: true },
	},
	intervention: {
		paymentId: { create: true, update: true },
		description: { create: true, update: true },
		maker: { create: true, update: true },
		startingTime: { create: true, update: true },
		endingTime: { create: true, update: true },
		payment: { strip: true },
	},
} as const satisfies Record<EntityMutationKey, Record<string, FieldMutationPolicy>>;

export const MUTATION_FIELDS_REJECTED_MESSAGE = "Campi non ammessi nella mutazione";

export function allowedKeysFor(entity: EntityMutationKey, op: MutationOp): string[] {
	const fields = MUTATION_ALLOWLIST[entity] as Record<string, FieldMutationPolicy>;
	return Object.entries(fields)
		.filter(([, policy]) => {
			if (policy.immutable) return false;
			return op === "create" ? !!policy.create : !!policy.update;
		})
		.map(([key]) => key);
}

export function adminOnlyKeysFor(entity: EntityMutationKey, op: MutationOp): string[] {
	const fields = MUTATION_ALLOWLIST[entity] as Record<string, FieldMutationPolicy>;
	return Object.entries(fields)
		.filter(([, policy]) => {
			if (!policy.adminOnly) return false;
			return op === "create" ? !!policy.create : !!policy.update;
		})
		.map(([key]) => key);
}

/**
 * Valida il payload di mutazione:
 * - campi `immutable` presenti → errore
 * - campi allowlist → tenuti
 * - campi `strip` (join di lettura) → ignorati
 * - chiavi sconosciute → errore
 *
 * Ritorna solo i campi ammessi per create/update.
 */
export function assertMutationPayload(
	entity: EntityMutationKey,
	op: MutationOp,
	payload: object
): Record<string, unknown> {
	const fields = MUTATION_ALLOWLIST[entity] as Record<string, FieldMutationPolicy>;
	const allowed = new Set(allowedKeysFor(entity, op));
	const rejected: string[] = [];
	const picked: Record<string, unknown> = {};

	for (const key of Object.keys(payload)) {
		const policy = fields[key];
		if (!policy) {
			rejected.push(key);
			continue;
		}
		if (policy.immutable) {
			rejected.push(key);
			continue;
		}
		if (policy.strip) {
			continue;
		}
		if (allowed.has(key)) {
			picked[key] = (payload as Record<string, unknown>)[key];
			continue;
		}
		// Create-only leftovers on update (es. username da row.original): strip.
		// write-only (password) su update → reject (non è un campo editabile).
		if (op === "update" && policy.create && !policy.update) {
			if (policy.writeOnly) {
				rejected.push(key);
			}
			continue;
		}
		if (op === "create" && policy.update && !policy.create) {
			continue;
		}
		rejected.push(key);
	}

	if (rejected.length > 0) {
		throw new Error(
			`${MUTATION_FIELDS_REJECTED_MESSAGE} (${entity}/${op}): ${rejected.join(", ")}`
		);
	}
	return picked;
}