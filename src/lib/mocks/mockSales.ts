import { Prisma, PrismaClient } from "@prisma/client";
import { snapshotFromProduct } from "@/lib/domain/sale-access";
import {
	MOCK_PRODUCTS,
	catalogPrice,
	chunksOf,
	mockScenario,
	randomDateBetween,
	weightedElement,
} from "./scenario";

const DAY = 24 * 60 * 60 * 1_000;

function laterDate(left: Date, right: Date): Date {
	return left > right ? left : right;
}

function daysBetween(from: Date, to: Date): number {
	return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY));
}

export async function mockSales(db: PrismaClient) {
	console.log("Mocking sales...");
	const clients = await db.client.findMany({
		select: { id: true, birthDate: true, enrollmentDate: true },
		orderBy: { id: "asc" },
	});
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true },
	});
	const catalogs = await db.catalog.findMany();

	if (clients.length === 0 || products.length === 0) {
		console.log("No clients or products found; skipping sales.");
		return;
	}

	const productByCode = new Map(products.map((product) => [product.code, product]));
	const availableProducts = MOCK_PRODUCTS.flatMap((definition) => {
		const product = productByCode.get(definition.code);
		if (!product) return [];
		return [{ ...definition, snapshot: snapshotFromProduct(product) }];
	});
	if (availableProducts.length === 0) {
		throw new Error("No configured mock product exists in the database.");
	}

	const catalogByYearAndProduct = new Map(
		catalogs.map((catalog) => [
			`${catalog.year}:${catalog.productCode}`,
			catalog.price,
		])
	);
	const definitionByCode = new Map(
		availableProducts.map((product) => [product.code, product])
	);
	const rows: Prisma.SaleCreateManyInput[] = [];

	function addSale(clientId: number, date: Date, productCode: string) {
		const product = definitionByCode.get(productCode);
		if (!product) return;
		const amount =
			catalogByYearAndProduct.get(`${date.getFullYear()}:${productCode}`) ??
			new Prisma.Decimal(catalogPrice(product.basePrice, date.getFullYear()));
		rows.push({
			clientId,
			date,
			amount,
			productCode,
			duration: product.snapshot.duration,
			entranceNumber: product.snapshot.entranceNumber,
		});
	}

	for (const [clientIndex, client] of clients.entries()) {
		const enrollmentDate = laterDate(client.enrollmentDate, mockScenario.openedAt);
		if (enrollmentDate > mockScenario.now) continue;

		const cohort = clientIndex % 20;
		const isActive = cohort < 11;
		const isAtRisk = cohort >= 11 && cohort < 15;
		const endDate = isActive
			? mockScenario.now
			: isAtRisk
				? new Date(mockScenario.now.getTime() - (45 + (clientIndex % 105)) * DAY)
				: new Date(
						mockScenario.now.getTime() -
							(190 + ((clientIndex * 17) % 720)) * DAY
					);
		const shortJourneyEnd = new Date(
			Math.min(
				mockScenario.now.getTime(),
				enrollmentDate.getTime() + (45 + (clientIndex % 75)) * DAY
			)
		);
		const safeEnd = endDate < enrollmentDate ? shortJourneyEnd : endDate;
		const journeyDays = daysBetween(enrollmentDate, safeEnd);
		const purchaseCount = Math.max(
			1,
			Math.min(
				18,
				Math.ceil(journeyDays / 120) +
					(journeyDays >= 240 ? clientIndex % 3 : 0)
			)
		);
		const dates: Date[] = [];

		for (let purchaseIndex = 0; purchaseIndex < purchaseCount; purchaseIndex++) {
			const progress =
				purchaseCount === 1 ? 1 : purchaseIndex / (purchaseCount - 1);
			const center =
				enrollmentDate.getTime() +
				(safeEnd.getTime() - enrollmentDate.getTime()) * progress;
			const span =
				(safeEnd.getTime() - enrollmentDate.getTime()) /
				Math.max(2, purchaseCount * 2);
			const from = new Date(Math.max(enrollmentDate.getTime(), center - span));
			const to = new Date(
				Math.min(mockScenario.now.getTime(), safeEnd.getTime(), center + span)
			);
			dates.push(randomDateBetween(from, to));
		}

		// A realistic share renews or joins this month; forcing every active
		// client here would create an implausible sales spike.
		if (isActive && clientIndex % 5 === 0) {
			const monthStart = new Date(
				mockScenario.now.getFullYear(),
				mockScenario.now.getMonth(),
				1
			);
			dates[dates.length - 1] = randomDateBetween(
				laterDate(enrollmentDate, monthStart),
				mockScenario.now
			);
		}
		dates.sort((left, right) => left.getTime() - right.getTime());

		let previousProduct: (typeof availableProducts)[number] | undefined;
		for (const [purchaseIndex, date] of dates.entries()) {
			const nextDate = dates[purchaseIndex + 1];
			const gap = nextDate ? daysBetween(date, nextDate) : Number.POSITIVE_INFINITY;
			const ageAtSale = Math.floor(
				(date.getTime() - client.birthDate.getTime()) / (365.25 * DAY)
			);
			let eligible = availableProducts.filter((product) => {
				if (product.code === "ABB-STUDENTI" && ageAtSale > 30) return false;
				if (product.code === "ABB-OVER65" && ageAtSale < 65) return false;
				return (
					product.kind === "entranceSet" ||
					!nextDate ||
					product.duration <= gap + 21
				);
			});
			if (eligible.length === 0) eligible = availableProducts;

			const canRenew =
				previousProduct != null &&
				eligible.some((product) => product.code === previousProduct?.code);
			const product =
				canRenew && (clientIndex + purchaseIndex) % 5 < 3
					? previousProduct!
					: weightedElement(eligible);
			addSale(client.id, date, product.code);
			previousProduct = product;
		}
	}

	// Keep reduced development datasets useful while the normal ~1,000-client
	// scenario naturally lands around 6,000 sales. Backfill only historical
	// periods so this density floor cannot inflate the current-month KPI.
	const minimumSales = Math.min(6_000, clients.length * 120);
	const currentMonthStart = new Date(
		mockScenario.now.getFullYear(),
		mockScenario.now.getMonth(),
		1
	);
	const historicalEnd = new Date(currentMonthStart.getTime() - 1);
	const historicalClients = clients.filter(
		(client) => client.enrollmentDate <= historicalEnd
	);
	for (let index = rows.length; index < minimumSales; index++) {
		const client =
			historicalClients[index % historicalClients.length] ??
			clients[index % clients.length];
		const from = laterDate(client.enrollmentDate, mockScenario.openedAt);
		const to = from <= historicalEnd ? historicalEnd : mockScenario.now;
		if (from > to) continue;
		const product = weightedElement(availableProducts);
		addSale(
			client.id,
			randomDateBetween(from, to),
			product.code
		);
	}

	// Explicitly cover every historical month even with unusual enrollment data.
	const coveredMonths = new Set(
		rows.map((row) => {
			const date =
				row.date instanceof Date ? row.date : new Date(row.date ?? 0);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		})
	);
	for (
		let month = new Date(
			mockScenario.openedAt.getFullYear(),
			mockScenario.openedAt.getMonth(),
			1
		);
		month <= mockScenario.now;
		month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
	) {
		const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
		if (coveredMonths.has(key)) continue;
		const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
		const eligibleClients = clients.filter(
			(client) => client.enrollmentDate <= monthEnd
		);
		if (eligibleClients.length === 0) continue;
		const client = eligibleClients[month.getMonth() % eligibleClients.length];
		const product = weightedElement(availableProducts);
		addSale(
			client.id,
			randomDateBetween(
				laterDate(client.enrollmentDate, month),
				monthEnd > mockScenario.now ? mockScenario.now : monthEnd
			),
			product.code
		);
	}

	for (const chunk of chunksOf(rows)) {
		await db.sale.createMany({ data: chunk });
	}

	console.log(`Created ${rows.length} mock sales with five-year client journeys.`);
}
