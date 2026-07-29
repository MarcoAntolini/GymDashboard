/**
 * Smoke: ranking prodotti (mix) + shape overview stats.
 * Esegui: npx tsx scripts/verify-cassa-mix.ts
 */
import assert from "node:assert/strict";
import { ProductKind } from "../src/lib/domain/product-kind";
import { rankProductsByRevenue } from "../src/lib/product-ranking";

function main() {
	const empty = rankProductsByRevenue([]);
	assert.equal(empty.length, 0);

	const ranked = rankProductsByRevenue([
		{ productCode: "PAC-10", amount: 50, duration: null, entranceNumber: 10 },
		{ productCode: "ABB-M", amount: 80, duration: 30, entranceNumber: null },
		{ productCode: "PAC-10", amount: 50, duration: null, entranceNumber: 10 },
		{ productCode: "ABB-M", amount: 40, duration: 30, entranceNumber: null },
		{ productCode: "ABB-Y", amount: 200, duration: 365, entranceNumber: null },
	]);

	assert.equal(ranked.length, 3);
	assert.equal(ranked[0]?.productCode, "ABB-Y");
	assert.equal(ranked[0]?.amount, 200);
	assert.equal(ranked[0]?.count, 1);
	assert.equal(ranked[0]?.kind, ProductKind.Membership);

	assert.equal(ranked[1]?.productCode, "ABB-M");
	assert.equal(ranked[1]?.amount, 120);
	assert.equal(ranked[1]?.count, 2);

	assert.equal(ranked[2]?.productCode, "PAC-10");
	assert.equal(ranked[2]?.amount, 100);
	assert.equal(ranked[2]?.count, 2);
	assert.equal(ranked[2]?.kind, ProductKind.EntranceSet);
	assert.equal(ranked[2]?.kindLabel, "Pacchetto ingressi");

	// Tie-break: stesso ricavo → più quantità prima
	const byCount = rankProductsByRevenue([
		{ productCode: "A", amount: 10, duration: 30, entranceNumber: null },
		{ productCode: "B", amount: 10, duration: null, entranceNumber: 5 },
		{ productCode: "B", amount: 10, duration: null, entranceNumber: 5 },
	]);
	assert.equal(byCount[0]?.productCode, "B");
	assert.equal(byCount[0]?.count, 2);
	assert.equal(byCount[1]?.productCode, "A");

	console.log("verify-cassa-mix: ok");
}

main();
