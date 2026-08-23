import { Prisma, PrismaClient } from "@prisma/client";
import { packageResidual } from "@/lib/domain/sale-access";
import { faker } from "./faker";
import {
	chunksOf,
	mockScenario,
	realisticActivityDate,
} from "./scenario";

const DAY = 24 * 60 * 60 * 1_000;

function boundedActivityDate(from: Date, to: Date): Date {
	const generated = realisticActivityDate(from, to);
	if (generated < from) return new Date(from);
	if (generated > to) return new Date(to);
	return generated;
}

export async function mockEntrances(db: PrismaClient) {
	console.log("Mocking entrances...");
	const sales = await db.sale.findMany({
		where: {
			date: { lte: mockScenario.now },
			OR: [{ duration: { not: null } }, { entranceNumber: { not: null } }],
		},
		include: { _count: { select: { entrance: true } } },
	});

	if (sales.length === 0) {
		console.log("No access-bearing sales found; skipping entrances.");
		return;
	}

	const targetTotal = faker.number.int({ min: 82_000, max: 88_000 });
	const existingTotal = sales.reduce(
		(total, sale) => total + sale._count.entrance,
		0
	);
	const targetToCreate = Math.max(0, targetTotal - existingTotal);
	if (targetToCreate === 0) {
		console.log(`Entrances already meet the target (${existingTotal}).`);
		return;
	}

	const rows: Prisma.EntranceCreateManyInput[] = [];
	const packageBudget = Math.floor(targetToCreate * 0.22);
	const packageSales = faker.helpers.shuffle(
		sales.filter((sale) => sale.entranceNumber != null)
	);

	for (const sale of packageSales) {
		if (rows.length >= packageBudget) break;
		const residual = Math.max(
			0,
			packageResidual(sale, sale._count.entrance) ?? 0
		);
		if (residual === 0) continue;

		const ageDays = Math.max(
			0,
			(mockScenario.now.getTime() - sale.date.getTime()) / DAY
		);
		const maturity = Math.min(1, ageDays / 150);
		const utilization = 0.35 + maturity * 0.5 + faker.number.float({ min: -0.08, max: 0.08 });
		const desired = Math.min(
			residual,
			packageBudget - rows.length,
			Math.max(1, Math.round((sale.entranceNumber ?? 0) * utilization))
		);

		for (let index = 0; index < desired; index++) {
			rows.push({
				saleId: sale.id,
				date: boundedActivityDate(sale.date, mockScenario.now),
			});
		}
	}

	const membershipSales = sales.flatMap((sale) => {
		if (sale.duration == null || sale.duration <= 0) return [];
		const expiration = new Date(sale.date.getTime() + sale.duration * DAY);
		const naturalEnd =
			expiration < mockScenario.now
				? new Date(expiration.getTime() - 1)
				: mockScenario.now;
		if (naturalEnd < sale.date) return [];

		const currentlyValid = expiration > mockScenario.now;
		const cohort = sale.clientId % 10;
		const atRisk = currentlyValid && (cohort === 6 || cohort === 7);
		const riskCutoff = new Date(
			mockScenario.now.getTime() - (35 + (sale.clientId % 61)) * DAY
		);
		const effectiveEnd =
			atRisk && riskCutoff > sale.date && riskCutoff < naturalEnd
				? riskCutoff
				: naturalEnd;
		const active = currentlyValid && cohort < 6;
		const recentFrom = new Date(mockScenario.now.getTime() - 30 * DAY);
		const canHaveRecentActivity = active && effectiveEnd >= recentFrom;
		const recentReserved = canHaveRecentActivity
			? 3 + (sale.clientId % 5)
			: 0;
		const effectiveDays = Math.max(
			1,
			(effectiveEnd.getTime() - sale.date.getTime()) / DAY
		);

		return [{
			sale,
			effectiveEnd,
			recentReserved,
			weight:
				effectiveDays *
				(0.8 + ((sale.clientId * 13 + sale.id) % 45) / 100),
			count: recentReserved,
		}];
	});

	const membershipBudget = targetToCreate - rows.length;
	const reservedTotal = membershipSales.reduce(
		(total, plan) => total + plan.recentReserved,
		0
	);
	let distributable = Math.max(0, membershipBudget - reservedTotal);
	const totalWeight = membershipSales.reduce(
		(total, plan) => total + plan.weight,
		0
	);

	for (const plan of membershipSales) {
		if (totalWeight === 0) break;
		const allocated = Math.floor(distributable * (plan.weight / totalWeight));
		plan.count += allocated;
	}
	let allocatedTotal = membershipSales.reduce(
		(total, plan) => total + plan.count,
		0
	);
	for (
		let index = 0;
		allocatedTotal < membershipBudget && membershipSales.length > 0;
		index++
	) {
		membershipSales[index % membershipSales.length].count++;
		allocatedTotal++;
	}

	for (const plan of membershipSales) {
		const recentFrom =
			plan.sale.date > new Date(mockScenario.now.getTime() - 30 * DAY)
				? plan.sale.date
				: new Date(mockScenario.now.getTime() - 30 * DAY);
		for (let index = 0; index < plan.count; index++) {
			const isReservedRecent = index < plan.recentReserved;
			rows.push({
				saleId: plan.sale.id,
				date: boundedActivityDate(
					isReservedRecent ? recentFrom : plan.sale.date,
					isReservedRecent ? mockScenario.now : plan.effectiveEnd
				),
			});
		}
	}

	// The membership allocation is exact in the normal scenario. This guard
	// protects custom datasets with no valid membership windows.
	if (rows.length > targetToCreate) rows.length = targetToCreate;

	for (const chunk of chunksOf(rows)) {
		await db.entrance.createMany({ data: chunk });
	}

	console.log(
		`Created ${rows.length} mock entrances (${targetTotal} target including existing data).`
	);
}
