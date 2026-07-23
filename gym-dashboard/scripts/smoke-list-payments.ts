/**
 * Smoke: listPayments detail search decomposes across specialization fields.
 * Run: npx tsx scripts/smoke-list-payments.ts
 */
import { listPayments } from "../src/data-access/payments";
import { DEFAULT_LIST_QUERY } from "../src/lib/list-query";

async function main() {
	const base = await listPayments({ ...DEFAULT_LIST_QUERY, pageSize: 5 });
	console.log("base total:", base.total, "items:", base.items.length);
	console.log(
		"facets typeLabel:",
		base.facets?.typeLabel?.map((f) => `${f.value}:${f.count}`).join(", ")
	);

	const byProvider = await listPayments({
		...DEFAULT_LIST_QUERY,
		pageSize: 20,
		filters: { detail: { kind: "text", value: "a" } },
	});
	console.log("detail contains 'a' total:", byProvider.total);

	const byType = await listPayments({
		...DEFAULT_LIST_QUERY,
		pageSize: 20,
		filters: { typeLabel: { kind: "enum", values: ["Bolletta"] } },
	});
	console.log(
		"typeLabel Bolletta total:",
		byType.total,
		"types:",
		[...new Set(byType.items.map((p) => p.type))].join(",")
	);

	console.log("smoke-list-payments: ok");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
