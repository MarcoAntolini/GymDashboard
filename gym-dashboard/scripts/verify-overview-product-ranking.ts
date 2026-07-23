/**
 * Smoke checks for overview cash + product-mix ranking (ticket 11).
 * Pure logic — no DB. Run: npx tsx scripts/verify-overview-product-ranking.ts
 */

type RankRow = {
	productCode: string;
	count: number;
	amount: number;
};

function sortByRevenue(rows: RankRow[]): RankRow[] {
	return [...rows].sort(
		(a, b) => b.amount - a.amount || b.count - a.count || a.productCode.localeCompare(b.productCode)
	);
}

function sortByQuantity(rows: RankRow[]): RankRow[] {
	return [...rows].sort(
		(a, b) => b.count - a.count || b.amount - a.amount || a.productCode.localeCompare(b.productCode)
	);
}

function assert(cond: unknown, message: string): asserts cond {
	if (!cond) throw new Error(message);
}

const sample: RankRow[] = [
	{ productCode: "ABB-M", count: 2, amount: 200 },
	{ productCode: "PAC-10", count: 5, amount: 150 },
	{ productCode: "ABB-Y", count: 1, amount: 400 },
	{ productCode: "PAC-5", count: 5, amount: 100 }
];

const byRevenue = sortByRevenue(sample).slice(0, 3);
assert(byRevenue[0]?.productCode === "ABB-Y", "top revenue should be ABB-Y");
assert(byRevenue[1]?.productCode === "ABB-M", "second revenue should be ABB-M");
assert(byRevenue[2]?.productCode === "PAC-10", "third revenue should be PAC-10");

const byQuantity = sortByQuantity(sample).slice(0, 3);
assert(byQuantity[0]?.productCode === "PAC-10", "top qty tie-break by amount → PAC-10");
assert(byQuantity[1]?.productCode === "PAC-5", "second qty should be PAC-5");
assert(byQuantity[2]?.productCode === "ABB-M", "third qty should be ABB-M");

console.log("verify-overview-product-ranking: ok");
