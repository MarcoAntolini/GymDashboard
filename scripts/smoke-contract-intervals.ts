import {
	contractIntervalsOverlap,
	OVERLAPPING_CONTRACT_ERROR,
} from "../src/lib/contract-intervals";

const d = (s: string) => new Date(s);

const cases: Array<{
	name: string;
	expected: boolean;
	a: { startingDate: Date; endingDate: Date | null };
	b: { startingDate: Date; endingDate: Date | null };
}> = [
	{
		name: "overlap mid",
		expected: true,
		a: { startingDate: d("2024-01-01"), endingDate: d("2024-06-01") },
		b: { startingDate: d("2024-03-01"), endingDate: d("2024-09-01") },
	},
	{
		name: "open-ended overlaps later",
		expected: true,
		a: { startingDate: d("2024-01-01"), endingDate: null },
		b: { startingDate: d("2024-06-01"), endingDate: d("2024-07-01") },
	},
	{
		name: "adjacent half-open OK",
		expected: false,
		a: { startingDate: d("2024-01-01"), endingDate: d("2024-06-01") },
		b: { startingDate: d("2024-06-01"), endingDate: d("2024-12-01") },
	},
	{
		name: "adjacent then open OK",
		expected: false,
		a: { startingDate: d("2024-01-01"), endingDate: d("2024-06-01") },
		b: { startingDate: d("2024-06-01"), endingDate: null },
	},
	{
		name: "identical overlap",
		expected: true,
		a: { startingDate: d("2024-01-01"), endingDate: d("2024-06-01") },
		b: { startingDate: d("2024-01-01"), endingDate: d("2024-06-01") },
	},
	{
		name: "two open-ended same employee overlap",
		expected: true,
		a: { startingDate: d("2024-01-01"), endingDate: null },
		b: { startingDate: d("2024-06-01"), endingDate: null },
	},
];

let failed = 0;
for (const c of cases) {
	const got = contractIntervalsOverlap(c.a, c.b);
	const ok = got === c.expected;
	console.log(`${ok ? "OK" : "FAIL"} ${c.name} => ${got} (expected ${c.expected})`);
	if (!ok) failed++;
}

if (!OVERLAPPING_CONTRACT_ERROR.includes("sovrappone")) {
	console.log("FAIL error message constant");
	failed++;
} else {
	console.log("OK error message constant");
}

process.exit(failed ? 1 : 0);
