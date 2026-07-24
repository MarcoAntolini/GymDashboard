import { ContractType } from "@prisma/client";
import {
	contractRequiresEndingDate,
	ENDING_DATE_BEFORE_START,
	FIXED_TERM_ENDING_DATE_REQUIRED,
	formatContractEndingDateLabel,
	resolveContractEndingDate
} from "../src/lib/contract-term";

const d = (s: string) => new Date(s);
let failed = 0;

function assert(name: string, ok: boolean) {
	console.log(`${ok ? "OK" : "FAIL"} ${name}`);
	if (!ok) failed++;
}

assert(
	"OpenEnded does not require ending date",
	contractRequiresEndingDate(ContractType.OpenEnded) === false
);
assert(
	"FixedTerm requires ending date",
	contractRequiresEndingDate(ContractType.FixedTerm) === true
);

assert(
	"OpenEnded normalizes to null even if date given",
	resolveContractEndingDate({
		type: ContractType.OpenEnded,
		startingDate: d("2024-01-01"),
		endingDate: d("2025-01-01")
	}) === null
);

const fixed = resolveContractEndingDate({
	type: ContractType.FixedTerm,
	startingDate: d("2024-01-01"),
	endingDate: d("2024-12-31")
});
assert("FixedTerm keeps ending date", fixed?.getTime() === d("2024-12-31").getTime());

try {
	resolveContractEndingDate({
		type: ContractType.FixedTerm,
		startingDate: d("2024-01-01"),
		endingDate: null
	});
	assert("FixedTerm without ending throws", false);
} catch (e) {
	assert(
		"FixedTerm without ending throws",
		e instanceof Error && e.message === FIXED_TERM_ENDING_DATE_REQUIRED
	);
}

try {
	resolveContractEndingDate({
		type: ContractType.FixedTerm,
		startingDate: d("2024-06-01"),
		endingDate: d("2024-01-01")
	});
	assert("ending before start throws", false);
} catch (e) {
	assert(
		"ending before start throws",
		e instanceof Error && e.message === ENDING_DATE_BEFORE_START
	);
}

assert(
	"OpenEnded list label is In corso",
	formatContractEndingDateLabel(ContractType.OpenEnded, null) === "In corso"
);
assert(
	"OpenEnded list label ignores stray date",
	formatContractEndingDateLabel(ContractType.OpenEnded, d("2025-01-01")) === "In corso"
);
assert(
	"FixedTerm list label shows date",
	formatContractEndingDateLabel(ContractType.FixedTerm, d("2024-12-31")) ===
		d("2024-12-31").toLocaleDateString()
);

process.exit(failed ? 1 : 0);
