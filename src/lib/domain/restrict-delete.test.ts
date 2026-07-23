import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "@prisma/client";
import {
	CLIENT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "./restrict-delete";

function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
	return new Prisma.PrismaClientKnownRequestError("constraint", {
		code,
		clientVersion: "test",
	});
}

describe("rethrowRestrictDelete", () => {
	it("maps P2003 to the user-facing message", () => {
		assert.throws(
			() => rethrowRestrictDelete(prismaKnownError("P2003"), CLIENT_HAS_PURCHASES_MESSAGE),
			(err: unknown) =>
				err instanceof Error && err.message === CLIENT_HAS_PURCHASES_MESSAGE
		);
	});

	it("maps P2014 to the user-facing message", () => {
		assert.throws(
			() => rethrowRestrictDelete(prismaKnownError("P2014"), CLIENT_HAS_PURCHASES_MESSAGE),
			(err: unknown) =>
				err instanceof Error && err.message === CLIENT_HAS_PURCHASES_MESSAGE
		);
	});

	it("rethrows unrelated errors unchanged", () => {
		const original = new Error("boom");
		assert.throws(
			() => rethrowRestrictDelete(original, CLIENT_HAS_PURCHASES_MESSAGE),
			(err: unknown) => err === original
		);
	});
});
