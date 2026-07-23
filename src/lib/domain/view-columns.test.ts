import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	COLUMN_CLASSES,
	FORBIDDEN_CLIENT_PERSISTED_KEYS,
	VIEW_COLUMN_MATRIX,
	VIEW_ENTITIES,
	columnClassFor,
	columnsOfClass,
	isForbiddenClientPersistedKey,
	viewColumns,
} from "./view-columns";

describe("VIEW_COLUMN_MATRIX", () => {
	it("covers every main CRUD entity", () => {
		for (const entity of VIEW_ENTITIES) {
			assert.ok(
				VIEW_COLUMN_MATRIX[entity].length > 0,
				`expected columns for ${entity}`
			);
		}
	});

	it("uses only known column classes", () => {
		for (const entity of VIEW_ENTITIES) {
			for (const col of VIEW_COLUMN_MATRIX[entity]) {
				assert.ok(
					(COLUMN_CLASSES as readonly string[]).includes(col.class),
					`${entity}.${col.key} has invalid class ${col.class}`
				);
			}
		}
	});

	it("classifies Acquisto snapshots and residual as non-nativa", () => {
		assert.equal(columnClassFor("acquisti", "amount"), "snapshot");
		assert.equal(columnClassFor("acquisti", "duration"), "snapshot");
		assert.equal(columnClassFor("acquisti", "entranceNumber"), "snapshot");
		assert.equal(columnClassFor("acquisti", "remainingEntrances"), "derivata");
		assert.equal(columnClassFor("acquisti", "client"), "join");
	});

	it("classifies Listino productKind as derivata (not nativa)", () => {
		assert.equal(columnClassFor("listino", "productKind"), "derivata");
		assert.equal(columnClassFor("listino", "price"), "nativa");
	});

	it("classifies Ingressi client label as join and kind as derivata", () => {
		assert.equal(columnClassFor("ingressi", "client"), "join");
		assert.equal(columnClassFor("ingressi", "productKind"), "derivata");
		assert.equal(columnClassFor("ingressi", "purchaseId"), "nativa");
	});

	it("does not list residual on clienti", () => {
		const keys = viewColumns("clienti").map((c) => c.key);
		for (const forbidden of FORBIDDEN_CLIENT_PERSISTED_KEYS) {
			assert.equal(keys.includes(forbidden), false);
		}
	});

	it("columnsOfClass filters by class", () => {
		const snapshots = columnsOfClass("acquisti", "snapshot");
		assert.deepEqual(
			snapshots.map((c) => c.key).sort(),
			["amount", "duration", "entranceNumber"].sort()
		);
	});
});

describe("isForbiddenClientPersistedKey", () => {
	it("flags residual-style keys that must not be persisted on Cliente", () => {
		assert.equal(isForbiddenClientPersistedKey("remainingEntrances"), true);
		assert.equal(isForbiddenClientPersistedKey("ingressi_rimanenti"), true);
		assert.equal(isForbiddenClientPersistedKey("name"), false);
	});
});
