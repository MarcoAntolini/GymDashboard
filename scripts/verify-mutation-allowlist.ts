/**
 * Verifica allowlist mutazioni (ticket 11).
 * Eseguire: npx tsx scripts/verify-mutation-allowlist.ts
 */

import {
	assertMutationPayload,
	MUTATION_FIELDS_REJECTED_MESSAGE,
	allowedKeysFor,
	adminOnlyKeysFor,
} from "../src/lib/domain/mutation-allowlist";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(`FAIL: ${message}`);
}

function expectReject(fn: () => void, label: string) {
	try {
		fn();
		throw new Error(`FAIL: expected reject — ${label}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		assert(msg.includes(MUTATION_FIELDS_REJECTED_MESSAGE), `${label}: ${msg}`);
		console.log(`ok: reject ${label}`);
	}
}

function run() {
	// Allowed sale update
	{
		const picked = assertMutationPayload("sale", "update", {
			id: 1,
			clientId: 2,
			date: new Date(),
			amount: "10.00",
			productCode: "M1",
			client: { name: "Rossi" },
		});
		assert(picked.id === 1, "id kept");
		assert(picked.clientId === 2, "clientId kept");
		assert(!("client" in picked), "join stripped");
		console.log("ok: sale update strips join");
	}

	// Snapshot immutable
	expectReject(
		() =>
			assertMutationPayload("sale", "update", {
				id: 1,
				clientId: 2,
				date: new Date(),
				amount: "10",
				productCode: "M1",
				duration: 30,
			}),
		"sale.duration"
	);

	expectReject(
		() =>
			assertMutationPayload("sale", "create", {
				clientId: 1,
				date: new Date(),
				amount: "10",
				productCode: "M1",
				entranceNumber: 10,
			}),
		"sale.entranceNumber"
	);

	// Entrance: saleId immutable
	expectReject(
		() =>
			assertMutationPayload("entrance", "create", {
				clientId: 1,
				date: new Date(),
				saleId: 99,
			}),
		"entrance.saleId"
	);

	// Derived type on catalog
	expectReject(
		() =>
			assertMutationPayload("catalog", "create", {
				year: 2026,
				productCode: "M1",
				price: "50",
				type: "Membership",
			}),
		"catalog.type"
	);

	// Client remainingEntrances
	expectReject(
		() =>
			assertMutationPayload("client", "create", {
				taxCode: "X",
				name: "A",
				surname: "B",
				birthDate: new Date(),
				street: "s",
				houseNumber: "1",
				city: "c",
				province: "RM",
				phoneNumber: "1",
				email: "a@b.c",
				enrollmentDate: new Date(),
				remainingEntrances: 3,
			}),
		"client.remainingEntrances"
	);

	// Account: password write-only rejected on update
	expectReject(
		() =>
			assertMutationPayload("account", "update", {
				employeeId: 1,
				role: "Admin",
				approved: true,
				password: "secret",
			}),
		"account.password on update"
	);

	// Account update allowlist
	{
		const keys = allowedKeysFor("account", "update").sort();
		assert(
			JSON.stringify(keys) === JSON.stringify(["approved", "employeeId", "role"]),
			`account update keys ${keys}`
		);
		const admin = adminOnlyKeysFor("account", "update").sort();
		assert(
			JSON.stringify(admin) === JSON.stringify(["approved", "role"]),
			`account admin keys ${admin}`
		);
		console.log("ok: account update / admin-only keys");
	}

	// Username create-only stripped on update
	{
		const picked = assertMutationPayload("account", "update", {
			employeeId: 1,
			role: "Employee",
			approved: false,
			username: "leftover",
		});
		assert(!("username" in picked), "username stripped on update");
		console.log("ok: account username stripped on update");
	}

	console.log("ALL verify-mutation-allowlist checks passed");
}

run();