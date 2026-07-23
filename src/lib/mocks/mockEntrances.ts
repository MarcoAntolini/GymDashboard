import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import {
	selectJustifyingPurchaseId,
	type PurchaseCandidate,
} from "../domain/entrance-justification";

/**
 * Attach mock Ingressi to existing Acquisti only (purchaseId), residual-aware for packs.
 * Skips clients with no justifying purchase at the chosen date.
 */
export async function mockEntrances(db: PrismaClient) {
	console.log("Mocking entrances...");
	const purchases = await db.purchase.findMany({
		include: { _count: { select: { entrances: true } } },
	});
	if (purchases.length === 0) {
		console.log("No purchases available — skipped mock entrances.");
		return;
	}

	const byClient = new Map<number, typeof purchases>();
	for (const purchase of purchases) {
		const list = byClient.get(purchase.clientId) ?? [];
		list.push(purchase);
		byClient.set(purchase.clientId, list);
	}

	const clientIds = [...byClient.keys()];
	const entrancesToCreate = 200;
	let created = 0;
	let attempts = 0;
	const maxAttempts = entrancesToCreate * 5;

	while (created < entrancesToCreate && attempts < maxAttempts) {
		attempts += 1;
		const clientId = faker.helpers.arrayElement(clientIds);
		const date = faker.date.recent({ days: 60 });
		const clientPurchases = byClient.get(clientId) ?? [];

		const candidates: PurchaseCandidate[] = clientPurchases.map((p) => ({
			id: p.id,
			date: p.date,
			duration: p.duration,
			entranceNumber: p.entranceNumber,
			usedEntranceCount: p._count.entrances,
		}));

		const purchaseId = selectJustifyingPurchaseId(candidates, date);
		if (purchaseId == null) {
			continue;
		}

		await db.entrance.create({
			data: {
				date,
				purchaseId,
			},
		});

		const purchased = clientPurchases.find((p) => p.id === purchaseId);
		if (purchased) {
			purchased._count.entrances += 1;
		}
		created += 1;
	}

	console.log(`Created ${created} mock entrances (${attempts} attempts).`);
}
