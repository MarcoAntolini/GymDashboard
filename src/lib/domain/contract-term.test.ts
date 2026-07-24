import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContractType } from "@prisma/client";
import { formatDateIt } from "@/lib/format/locale";
import {
	CONTRACT_ENDING_DATE_BEFORE_START_ERROR,
	CONTRACT_ENDING_DATE_FORBIDDEN_ERROR,
	CONTRACT_ENDING_DATE_REQUIRED_ERROR,
	CONTRACT_IN_PROGRESS_LABEL,
	assertContractEndingDate,
	formatContractEndingDateDisplay,
	isFixedTermContract,
	isOpenEndedContract,
	normalizeContractEndingDate,
} from "./contract-term";

function d(iso: string): Date {
	return new Date(iso);
}

describe("contract-term", () => {
	it("classifies OpenEnded as indeterminato and FixedTerm as determinato", () => {
		assert.equal(isOpenEndedContract(ContractType.OpenEnded), true);
		assert.equal(isFixedTermContract(ContractType.OpenEnded), false);
		assert.equal(isFixedTermContract(ContractType.FixedTerm), true);
		assert.equal(isOpenEndedContract(ContractType.FixedTerm), false);
	});

	it("normalizes endingDate to null for OpenEnded even if a date was provided", () => {
		assert.equal(
			normalizeContractEndingDate(ContractType.OpenEnded, d("2026-12-01")),
			null
		);
		assert.equal(normalizeContractEndingDate(ContractType.OpenEnded, undefined), null);
	});

	it("keeps endingDate for FixedTerm", () => {
		const end = d("2026-12-01");
		assert.equal(normalizeContractEndingDate(ContractType.FixedTerm, end), end);
		assert.equal(normalizeContractEndingDate(ContractType.FixedTerm, undefined), null);
	});

	it("rejects FixedTerm without endingDate", () => {
		assert.throws(
			() => assertContractEndingDate(ContractType.FixedTerm, d("2026-01-01"), null),
			(err: Error) => err.message === CONTRACT_ENDING_DATE_REQUIRED_ERROR
		);
	});

	it("rejects FixedTerm with endingDate before startingDate", () => {
		assert.throws(
			() =>
				assertContractEndingDate(
					ContractType.FixedTerm,
					d("2026-06-01"),
					d("2026-01-01")
				),
			(err: Error) => err.message === CONTRACT_ENDING_DATE_BEFORE_START_ERROR
		);
	});

	it("rejects OpenEnded with endingDate set", () => {
		assert.throws(
			() =>
				assertContractEndingDate(
					ContractType.OpenEnded,
					d("2026-01-01"),
					d("2026-12-01")
				),
			(err: Error) => err.message === CONTRACT_ENDING_DATE_FORBIDDEN_ERROR
		);
	});

	it("accepts valid FixedTerm and OpenEnded pairs", () => {
		assert.doesNotThrow(() =>
			assertContractEndingDate(
				ContractType.FixedTerm,
				d("2026-01-01"),
				d("2026-12-01")
			)
		);
		assert.doesNotThrow(() =>
			assertContractEndingDate(ContractType.OpenEnded, d("2026-01-01"), null)
		);
	});

	it("formats list label: OpenEnded / null → In corso; FixedTerm → date", () => {
		assert.equal(
			formatContractEndingDateDisplay(ContractType.OpenEnded, null),
			CONTRACT_IN_PROGRESS_LABEL
		);
		assert.equal(
			formatContractEndingDateDisplay(ContractType.OpenEnded, d("2026-12-01")),
			CONTRACT_IN_PROGRESS_LABEL
		);
		assert.equal(
			formatContractEndingDateDisplay(ContractType.FixedTerm, null),
			CONTRACT_IN_PROGRESS_LABEL
		);
		assert.equal(
			formatContractEndingDateDisplay(ContractType.FixedTerm, d("2026-12-01")),
			formatDateIt(d("2026-12-01"))
		);
	});
});
