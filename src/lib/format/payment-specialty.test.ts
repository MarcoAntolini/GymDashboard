import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaymentType } from "@prisma/client";
import {
	formatPaymentSpecialtySummary,
	formatPaymentTypeLabel,
	paymentSpecialtyDetailLines,
} from "./payment-specialty";

describe("formatPaymentTypeLabel", () => {
	it("maps Prisma enum keys to Italian domain labels", () => {
		assert.equal(formatPaymentTypeLabel(PaymentType.Salary), "Stipendio");
		assert.equal(formatPaymentTypeLabel(PaymentType.Bill), "Bolletta");
		assert.equal(formatPaymentTypeLabel(PaymentType.Equipment), "Attrezzatura");
		assert.equal(formatPaymentTypeLabel(PaymentType.Intervention), "Intervento");
	});
});

describe("formatPaymentSpecialtySummary", () => {
	it("summarizes Stipendio by Dipendente id", () => {
		assert.equal(
			formatPaymentSpecialtySummary({
				type: PaymentType.Salary,
				salary: { employeeId: 7 },
			}),
			"Dipendente #7"
		);
	});

	it("summarizes Bolletta with fornitore", () => {
		assert.match(
			formatPaymentSpecialtySummary({
				type: PaymentType.Bill,
				bill: { description: "Luce", provider: "ENEL" },
			}),
			/Luce.*ENEL/
		);
	});

	it("summarizes Intervento with esecutore", () => {
		assert.match(
			formatPaymentSpecialtySummary({
				type: PaymentType.Intervention,
				intervention: {
					description: "Manutenzione",
					maker: "Rossi",
					startingTime: new Date("2026-01-10T09:00:00"),
					endingTime: new Date("2026-01-10T11:00:00"),
				},
			}),
			/Manutenzione.*Rossi/
		);
	});

	it("returns em dash when specialty row missing", () => {
		assert.equal(
			formatPaymentSpecialtySummary({
				type: PaymentType.Salary,
				salary: null,
			}),
			"—"
		);
	});
});

describe("paymentSpecialtyDetailLines", () => {
	it("exposes Attrezzatura fields for edit inspection", () => {
		const lines = paymentSpecialtyDetailLines({
			type: PaymentType.Equipment,
			equipment: { description: "Panca", provider: "TechnoGym" },
		});
		assert.deepEqual(lines, [
			{ label: "Descrizione", value: "Panca" },
			{ label: "Fornitore", value: "TechnoGym" },
		]);
	});
});
