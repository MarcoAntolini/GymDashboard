import { Prisma } from "@prisma/client";

/**
 * Payload Prisma → valori ammessi dal bridge Server → Client Component.
 * `Decimal` non è serializzabile; `Date` sì e va preservata.
 */
export type ClientOf<T> = T extends Prisma.Decimal
	? number
	: T extends Date
		? Date
		: T extends bigint
			? number
			: T extends Array<infer U>
				? ClientOf<U>[]
				: T extends object
					? { [K in keyof T]: ClientOf<T[K]> }
					: T;

function isDecimal(value: object): value is Prisma.Decimal {
	return Prisma.Decimal.isDecimal(value);
}

function convert(value: unknown): unknown {
	if (value == null) return value;
	if (value instanceof Date) return value;
	if (typeof value === "bigint") return Number(value);
	if (typeof value !== "object") return value;
	if (isDecimal(value)) return value.toNumber();
	if (Array.isArray(value)) return value.map(convert);
	const out: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value)) {
		out[key] = convert(nested);
	}
	return out;
}

export function toClient<T>(value: T): ClientOf<T> {
	return convert(value) as ClientOf<T>;
}
