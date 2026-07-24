import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContractType, PaymentType, Role } from "@prisma/client";
import {
	approvalStatusVisual,
	contractTypeChip,
	paymentTypeChip,
	productKindChip,
	remainingEntrancesVisual,
	roleChip,
} from "./domain-visuals";

describe("domain-visuals chips/badges", () => {
	it("maps payment types to labeled chips with fixed tones", () => {
		assert.deepEqual(paymentTypeChip(PaymentType.Bill), {
			label: "Bolletta",
			tone: "warning",
		});
		assert.deepEqual(paymentTypeChip(PaymentType.Equipment), {
			label: "Attrezzatura",
			tone: "info",
		});
	});

	it("maps product kinds and roles with Italian labels", () => {
		assert.deepEqual(productKindChip("EntranceSet"), {
			label: "Pacchetto ingressi",
			tone: "info",
		});
		assert.equal(productKindChip(null), null);
		assert.deepEqual(roleChip(Role.Admin), {
			label: "Amministratore",
			tone: "warning",
		});
		assert.equal(contractTypeChip(ContractType.FixedTerm).label, "Tempo determinato");
	});

	it("maps approval and remaining as status visuals with icons", () => {
		const approved = approvalStatusVisual(true);
		assert.equal(approved.label, "Approvato");
		assert.equal(approved.tone, "success");
		assert.ok(approved.icon);

		const pending = approvalStatusVisual(false);
		assert.equal(pending.label, "In attesa");
		assert.equal(pending.tone, "warning");

		assert.equal(remainingEntrancesVisual(null), null);
		assert.equal(remainingEntrancesVisual(0)?.tone, "destructive");
		assert.equal(remainingEntrancesVisual(2)?.tone, "warning");
		assert.equal(remainingEntrancesVisual(10)?.tone, "success");
	});
});
