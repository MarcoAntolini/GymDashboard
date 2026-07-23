import { Prisma } from "@prisma/client";

/** User-facing message when deleting a Cliente blocked by Acquisti (FK Restrict). */
export const CLIENT_HAS_PURCHASES_MESSAGE =
	"Impossibile eliminare il Cliente: esistono Acquisti collegati.";

/**
 * Maps Prisma Restrict / required-relation failures to a clear Error.
 * Re-throws other errors unchanged.
 */
export function rethrowRestrictDelete(
	error: unknown,
	userMessage: string
): never {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		(error.code === "P2003" || error.code === "P2014")
	) {
		throw new Error(userMessage);
	}
	throw error;
}
