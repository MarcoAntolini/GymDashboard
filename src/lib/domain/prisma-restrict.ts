import { Prisma } from "@prisma/client";

/** True when Prisma refused a delete/update due to a Restrict FK (or related required relation). */
export function isPrismaRestrictError(error: unknown): boolean {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		(error.code === "P2003" || error.code === "P2014")
	);
}

/**
 * Re-throw Restrict violations with a domain message so the UI toast explains the block.
 * Other errors are re-thrown unchanged.
 */
export function throwIfRestrictViolation(error: unknown, message: string): never {
	if (isPrismaRestrictError(error)) {
		throw new Error(message);
	}
	throw error;
}
