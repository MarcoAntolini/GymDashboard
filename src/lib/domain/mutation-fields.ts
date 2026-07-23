/**
 * Mutation allowlist (ticket 11), aligned with VIEW_COLUMN_MATRIX (ticket 10).
 *
 * Flags per field:
 * - `create` — accepted on create payloads
 * - `update` — accepted as mutable data on update
 * - `identity` — PK / where key on update (not rewritten as data unless also `update`)
 * - `immutable` — never accepted from clients (join / derivata / server-only snapshot)
 * - `admin-only` — mutable only by Admin+ (session gate via requireRole; Owner inherits; hierarchy on Account → ticket 14)
 * - `write-only` — accepted on create; never read back as an editable form value
 */

import { VIEW_ENTITIES, type ViewEntity } from "./view-columns";

export const MUTATION_FLAGS = [
	"create",
	"update",
	"identity",
	"immutable",
	"admin-only",
	"write-only",
] as const;

export type MutationFlag = (typeof MUTATION_FLAGS)[number];

export type MutationOp = "create" | "update";

export type MutationEntity = ViewEntity;

export type MutationFieldSpec = {
	key: string;
	flags: readonly MutationFlag[];
	notes?: string;
};

export const MUTATION_ALLOWLIST_ERROR = "Campo non consentito per questa mutazione";

/**
 * Matrix: entity → field → mutation flags.
 * Join / derivata from views are `immutable`. Snapshots are create-time only
 * (server-filled or optional create override) unless an edge case is documented.
 */
export const MUTATION_FIELD_MATRIX: Record<MutationEntity, readonly MutationFieldSpec[]> = {
	clienti: [
		{ key: "id", flags: ["identity"] },
		{ key: "taxCode", flags: ["create", "update"] },
		{ key: "name", flags: ["create", "update"] },
		{ key: "surname", flags: ["create", "update"] },
		{ key: "birthDate", flags: ["create", "update"] },
		{ key: "street", flags: ["create", "update"] },
		{ key: "houseNumber", flags: ["create", "update"] },
		{ key: "city", flags: ["create", "update"] },
		{ key: "province", flags: ["create", "update"] },
		{ key: "phoneNumber", flags: ["create", "update"] },
		{ key: "email", flags: ["create", "update"] },
		{ key: "enrollmentDate", flags: ["create", "update"] },
		{
			key: "remainingEntrances",
			flags: ["immutable"],
			notes: "Derivata on Acquisto only — never on Cliente",
		},
	],
	acquisti: [
		{ key: "id", flags: ["identity"] },
		{ key: "clientId", flags: ["create", "update"] },
		{ key: "date", flags: ["create", "update"] },
		{
			key: "productCode",
			flags: ["create"],
			notes:
				"Edge case: changing Prodotto on an existing Acquisto is forbidden — open a new Acquisto (or delete+recreate). Snapshots durata/N stay tied to the sale-time product.",
		},
		{
			key: "amount",
			flags: ["create"],
			notes: "Optional create override (sconto); sale snapshot — not freely editable later",
		},
		{
			key: "duration",
			flags: ["immutable"],
			notes: "Server copies from Abbonamento at create; never from client",
		},
		{
			key: "entranceNumber",
			flags: ["immutable"],
			notes: "Server copies from Pacchetto at create; never from client",
		},
		{ key: "remainingEntrances", flags: ["immutable"], notes: "DTO derivata" },
		{ key: "client", flags: ["immutable"], notes: "join label" },
		{ key: "prodotto", flags: ["immutable"], notes: "join" },
		{ key: "_count", flags: ["immutable"], notes: "internal aggregate" },
	],
	ingressi: [
		{ key: "id", flags: ["identity"] },
		{ key: "date", flags: ["create", "update"] },
		{
			key: "clientId",
			flags: ["create", "update"],
			notes: "Operational input for justification; Ingresso stores purchaseId only",
		},
		{
			key: "purchaseId",
			flags: ["immutable"],
			notes: "Resolved server-side via justification — not a free client field",
		},
		{ key: "client", flags: ["immutable"], notes: "join" },
		{ key: "product", flags: ["immutable"], notes: "join" },
		{ key: "productKind", flags: ["immutable"], notes: "derivata" },
		{ key: "purchase", flags: ["immutable"], notes: "join graph on DTO" },
	],
	prodotti: [
		{ key: "code", flags: ["create", "identity"] },
		{ key: "productKind", flags: ["immutable"], notes: "derivata" },
		{ key: "membership", flags: ["immutable"], notes: "join / include" },
		{ key: "entranceSet", flags: ["immutable"], notes: "join / include" },
	],
	abbonamenti: [
		{ key: "productCode", flags: ["create", "identity"] },
		{ key: "duration", flags: ["create", "update"] },
		{ key: "product", flags: ["immutable"], notes: "join / include" },
	],
	pacchetti_ingressi: [
		{ key: "productCode", flags: ["create", "identity"] },
		{ key: "entranceNumber", flags: ["create", "update"] },
		{ key: "product", flags: ["immutable"], notes: "join / include" },
	],
	listino: [
		{ key: "year", flags: ["create", "identity"] },
		{ key: "productCode", flags: ["create", "identity"] },
		{ key: "price", flags: ["create", "update"] },
		{ key: "productKind", flags: ["immutable"], notes: "derivata" },
		{ key: "product", flags: ["immutable"], notes: "join" },
	],
	dipendenti: [
		{ key: "id", flags: ["identity"] },
		{ key: "taxCode", flags: ["create", "update"] },
		{ key: "name", flags: ["create", "update"] },
		{ key: "surname", flags: ["create", "update"] },
		{ key: "birthDate", flags: ["create", "update"] },
		{ key: "street", flags: ["create", "update"] },
		{ key: "houseNumber", flags: ["create", "update"] },
		{ key: "city", flags: ["create", "update"] },
		{ key: "province", flags: ["create", "update"] },
		{ key: "phoneNumber", flags: ["create", "update"] },
		{ key: "email", flags: ["create", "update"] },
		{ key: "hiringDate", flags: ["create", "update"] },
	],
	account: [
		{ key: "employeeId", flags: ["create", "identity"] },
		{ key: "username", flags: ["create"] },
		{
			key: "password",
			flags: ["write-only", "create"],
			notes:
				"Write-only on create; absent from update. List UI masks with per-row reveal (ticket 15); self-service change → ticket 17",
		},
		{
			key: "role",
			flags: ["admin-only", "update"],
			notes:
				"Admin+ only; requireRole(Admin) + hierarchy (Owner>Admin>Employee); Owner never assignable via UI",
		},
		{
			key: "approved",
			flags: ["admin-only", "update"],
			notes: "Approvazione — Admin+ only; same hierarchy gate as role on editAccount",
		},
		{ key: "employee", flags: ["immutable"], notes: "join / include" },
	],
	contratti: [
		{ key: "employeeId", flags: ["create", "identity"] },
		{
			key: "startingDate",
			flags: ["create", "identity"],
			notes: "Composite PK — not rewritten on update",
		},
		{ key: "type", flags: ["create", "update"] },
		{ key: "hourlyFee", flags: ["create", "update"] },
		{
			key: "endingDate",
			flags: ["create", "update"],
			notes:
				"Edge case: OpenEnded → must be null; FixedTerm → required date ≥ startingDate (contract-term.ts). Type change re-normalizes endingDate.",
		},
		{ key: "employee", flags: ["immutable"], notes: "join" },
	],
	timbrature: [
		{ key: "employeeId", flags: ["create", "identity"] },
		{
			key: "entranceTime",
			flags: ["create", "identity"],
			notes: "Historical identity of the Timbratura — not freely rewritten",
		},
		{ key: "exitTime", flags: ["create", "update"] },
	],
	stipendi: [
		{ key: "paymentId", flags: ["create", "identity"] },
		{ key: "employeeId", flags: ["create", "update"] },
		{ key: "payment", flags: ["immutable"], notes: "join" },
		{ key: "employee", flags: ["immutable"], notes: "join" },
	],
	bollette: [
		{ key: "paymentId", flags: ["create", "identity"] },
		{ key: "description", flags: ["create", "update"] },
		{ key: "provider", flags: ["create", "update"] },
		{ key: "payment", flags: ["immutable"], notes: "join" },
	],
	attrezzatura: [
		{ key: "paymentId", flags: ["create", "identity"] },
		{ key: "description", flags: ["create", "update"] },
		{ key: "provider", flags: ["create", "update"] },
		{ key: "payment", flags: ["immutable"], notes: "join" },
	],
	interventi: [
		{ key: "paymentId", flags: ["create", "identity"] },
		{ key: "description", flags: ["create", "update"] },
		{
			key: "maker",
			flags: ["create", "update"],
			notes: "Prisma/UI field (view matrix historically listed provider)",
		},
		{ key: "provider", flags: ["immutable"], notes: "Not the interventi write field — use maker" },
		{ key: "startingTime", flags: ["create", "update"] },
		{ key: "endingTime", flags: ["create", "update"] },
		{ key: "payment", flags: ["immutable"], notes: "join" },
	],
	pagamenti: [
		{ key: "id", flags: ["identity"] },
		{ key: "date", flags: ["create", "update"] },
		{ key: "amount", flags: ["create", "update"] },
		{
			key: "type",
			flags: ["create", "update"],
			notes: "Discriminator; specialty rows created only on create",
		},
		{ key: "employeeId", flags: ["create"], notes: "Salary specialty on create only" },
		{ key: "description", flags: ["create"], notes: "Bill/Equipment/Intervention specialty" },
		{ key: "provider", flags: ["create"], notes: "Bill/Equipment specialty" },
		{ key: "maker", flags: ["create"], notes: "Intervention specialty" },
		{ key: "startingTime", flags: ["create"], notes: "Intervention specialty" },
		{ key: "endingTime", flags: ["create"], notes: "Intervention specialty" },
		{ key: "intervention", flags: ["immutable"], notes: "join / include" },
		{ key: "equipment", flags: ["immutable"], notes: "join / include" },
		{ key: "bill", flags: ["immutable"], notes: "join / include" },
		{ key: "salary", flags: ["immutable"], notes: "join / include" },
	],
} as const;

/** Documented edge cases for agents/humans (also mirrored in field notes). */
export const MUTATION_EDGE_CASES = [
	{
		id: "acquisto-cambio-prodotto",
		summary:
			"Cambio Prodotto su Acquisto esistente: vietato. Creare un nuovo Acquisto (o delete+recreate). productCode/amount/duration/entranceNumber non sono update.",
	},
	{
		id: "contratto-data-fine",
		summary:
			"DataFine Contratto: editabile con regole type — OpenEnded ⇒ null; FixedTerm ⇒ data obbligatoria ≥ startingDate (normalize/assert in contract-term.ts).",
	},
	{
		id: "account-password",
		summary:
			"Password Account: write-only in create; assente da update. Lista mascherata con reveal per riga (ticket 15). Change password self-service → ticket 17. role/approved = admin-only (RBAC).",
	},
] as const;

export function mutationFields(entity: MutationEntity): readonly MutationFieldSpec[] {
	return MUTATION_FIELD_MATRIX[entity];
}

export function mutationFieldSpec(
	entity: MutationEntity,
	key: string
): MutationFieldSpec | undefined {
	return MUTATION_FIELD_MATRIX[entity].find((field) => field.key === key);
}

export function isFlagged(
	entity: MutationEntity,
	key: string,
	flag: MutationFlag
): boolean {
	return mutationFieldSpec(entity, key)?.flags.includes(flag) ?? false;
}

function isAllowedForOp(spec: MutationFieldSpec, op: MutationOp): boolean {
	const { flags } = spec;
	if (flags.includes("immutable")) {
		return false;
	}
	if (op === "create") {
		return (
			flags.includes("create") ||
			flags.includes("write-only") ||
			// admin-only fields are not set on create by clients (server defaults)
			false
		);
	}
	// update
	return (
		flags.includes("update") ||
		flags.includes("identity") ||
		flags.includes("admin-only")
	);
}

/** Keys accepted in a create/update payload for the entity. */
export function allowedMutationKeys(
	entity: MutationEntity,
	op: MutationOp
): readonly string[] {
	return MUTATION_FIELD_MATRIX[entity]
		.filter((spec) => isAllowedForOp(spec, op))
		.map((spec) => spec.key);
}

export class MutationAllowlistError extends Error {
	readonly entity: MutationEntity;
	readonly op: MutationOp;
	readonly disallowedKeys: readonly string[];

	constructor(entity: MutationEntity, op: MutationOp, disallowedKeys: readonly string[]) {
		super(
			`${MUTATION_ALLOWLIST_ERROR}: ${entity}/${op} → ${disallowedKeys.join(", ")}`
		);
		this.name = "MutationAllowlistError";
		this.entity = entity;
		this.op = op;
		this.disallowedKeys = disallowedKeys;
	}
}

/**
 * Reject payloads that contain keys outside the allowlist for this entity/op.
 * Returns the same payload typed as T when valid (for chaining).
 */
export function assertAllowedMutation<T extends object>(
	entity: MutationEntity,
	op: MutationOp,
	payload: T
): T {
	const allowed = new Set(allowedMutationKeys(entity, op));
	const disallowed = Object.keys(payload).filter((key) => !allowed.has(key));
	if (disallowed.length > 0) {
		throw new MutationAllowlistError(entity, op, disallowed);
	}
	return payload;
}

/** Sanity: every view entity has a mutation matrix row. */
export function mutationEntities(): readonly MutationEntity[] {
	return VIEW_ENTITIES;
}
