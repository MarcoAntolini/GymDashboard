import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PROFILE_OWNERSHIP_ERROR,
	assertOwnAccount,
	assertPasswordChangeAllowed,
	isOwnAccount,
} from "./profile-ownership";

describe("isOwnAccount", () => {
	it("returns true when usernames match", () => {
		assert.equal(isOwnAccount("marco", "marco"), true);
	});

	it("returns false when usernames differ", () => {
		assert.equal(isOwnAccount("marco", "luca"), false);
	});
});

describe("assertOwnAccount", () => {
	it("allows matching session and target", () => {
		assert.doesNotThrow(() => assertOwnAccount("marco", "marco"));
	});

	it("rejects updating another Account's credentials", () => {
		assert.throws(() => assertOwnAccount("marco", "luca"), (err: Error) => {
			assert.equal(err.message, PROFILE_OWNERSHIP_ERROR);
			return true;
		});
	});
});

describe("assertPasswordChangeAllowed", () => {
	it("requires current password to be provided", () => {
		assert.throws(
			() =>
				assertPasswordChangeAllowed({
					currentPasswordProvided: false,
					currentPasswordMatches: false,
				}),
			/attuale obbligatoria/
		);
	});

	it("rejects when current password does not match", () => {
		assert.throws(
			() =>
				assertPasswordChangeAllowed({
					currentPasswordProvided: true,
					currentPasswordMatches: false,
				}),
			/non corretta/
		);
	});

	it("allows when current password matches", () => {
		assert.doesNotThrow(() =>
			assertPasswordChangeAllowed({
				currentPasswordProvided: true,
				currentPasswordMatches: true,
			})
		);
	});
});
