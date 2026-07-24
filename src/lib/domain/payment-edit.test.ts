import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaymentType } from "@prisma/client";
import {
	PAYMENT_TYPE_IMMUTABLE_MESSAGE,
	assertPaymentTypeUnchanged,
} from "./payment-edit";

describe("assertPaymentTypeUnchanged", () => {
	it("allows same tipo", () => {
		assert.doesNotThrow(() =>
			assertPaymentTypeUnchanged(PaymentType.Salary, PaymentType.Salary)
		);
	});

	it("rejects tipo change that would orphan specialty", () => {
		assert.throws(
			() =>
				assertPaymentTypeUnchanged(PaymentType.Salary, PaymentType.Bill),
			(err: unknown) =>
				err instanceof Error && err.message === PAYMENT_TYPE_IMMUTABLE_MESSAGE
		);
	});
});
