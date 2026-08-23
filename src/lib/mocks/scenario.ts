import {
	addDays,
	endOfDay,
	startOfDay,
	startOfYear,
	subYears,
} from "date-fns";
import { faker } from "./faker";

export const MOCK_SEED = 731_945;

export const MOCK_SCALE = {
	clients: 1_000,
	employees: 24,
	batchSize: 1_000,
} as const;

export type MockProductDefinition =
	| {
			code: string;
			description: string;
			active?: boolean;
			kind: "membership";
			duration: number;
			basePrice: number;
			weight: number;
		}
	| {
			code: string;
			description: string;
			active?: boolean;
			kind: "entranceSet";
			entranceNumber: number;
			basePrice: number;
			weight: number;
		};

export const MOCK_PRODUCTS: readonly MockProductDefinition[] = [
	{ code: "ABB-MENSILE", description: "Abbonamento mensile", kind: "membership", duration: 30, basePrice: 59, weight: 9 },
	{ code: "ABB-TRIMESTRALE", description: "Abbonamento trimestrale", kind: "membership", duration: 90, basePrice: 159, weight: 10 },
	{ code: "ABB-SEMESTRALE", description: "Abbonamento semestrale", kind: "membership", duration: 180, basePrice: 289, weight: 15 },
	{ code: "ABB-ANNUALE", description: "Abbonamento annuale", kind: "membership", duration: 365, basePrice: 519, weight: 24 },
	{ code: "ABB-STUDENTI", description: "Tariffa studenti under 26", kind: "membership", duration: 365, basePrice: 429, weight: 8 },
	{ code: "ABB-OVER65", description: "Tariffa over 65", kind: "membership", duration: 365, basePrice: 399, weight: 4 },
	{ code: "ABB-OFFPEAK", description: "Accesso fascia oraria ridotta", active: false, kind: "membership", duration: 180, basePrice: 229, weight: 5 },
	{ code: "ABB-AZIENDALE", description: "Convenzione aziendale", kind: "membership", duration: 365, basePrice: 459, weight: 3 },
	{ code: "PAC-005", description: "Carnet 5 ingressi", kind: "entranceSet", entranceNumber: 5, basePrice: 69, weight: 4 },
	{ code: "PAC-010", description: "Carnet 10 ingressi", kind: "entranceSet", entranceNumber: 10, basePrice: 129, weight: 7 },
	{ code: "PAC-020", description: "Carnet 20 ingressi", kind: "entranceSet", entranceNumber: 20, basePrice: 239, weight: 7 },
	{ code: "PAC-030", description: "Carnet 30 ingressi", kind: "entranceSet", entranceNumber: 30, basePrice: 329, weight: 3 },
	{ code: "PAC-050", description: "Carnet 50 ingressi", kind: "entranceSet", entranceNumber: 50, basePrice: 499, weight: 1 },
] as const;

const now = new Date();

export const mockScenario = {
	now,
	today: startOfDay(now),
	openedAt: startOfDay(subYears(now, 5)),
	firstCatalogYear: startOfYear(subYears(now, 5)).getFullYear(),
	currentYear: now.getFullYear(),
} as const;

export function resetMockRandomness() {
	faker.seed(MOCK_SEED);
}

export function randomDateBetween(from: Date, to: Date): Date {
	if (from >= to) return new Date(from);
	return faker.date.between({ from, to });
}

export function weightedElement<T extends { weight: number }>(items: readonly T[]): T {
	const total = items.reduce((sum, item) => sum + item.weight, 0);
	let cursor = faker.number.float({ min: 0, max: total });
	for (const item of items) {
		cursor -= item.weight;
		if (cursor <= 0) return item;
	}
	return items[items.length - 1];
}

export function catalogPrice(basePrice: number, year: number): number {
	const yearsFromOpening = year - mockScenario.firstCatalogYear;
	const inflated = basePrice * Math.pow(1.027, Math.max(0, yearsFromOpening));
	return Math.round(inflated / 5) * 5 - 1;
}

export function dateAtGymTime(day: Date): Date {
	const result = new Date(day);
	const peak = faker.helpers.weightedArrayElement([
		{ value: "morning" as const, weight: 30 },
		{ value: "lunch" as const, weight: 15 },
		{ value: "evening" as const, weight: 48 },
		{ value: "quiet" as const, weight: 7 },
	]);
	const hour =
		peak === "morning"
			? faker.number.int({ min: 6, max: 9 })
			: peak === "lunch"
				? faker.number.int({ min: 12, max: 14 })
				: peak === "evening"
					? faker.number.int({ min: 17, max: 21 })
					: faker.number.int({ min: 10, max: 16 });
	result.setHours(hour, faker.number.int({ min: 0, max: 59 }), faker.number.int({ min: 0, max: 59 }), 0);
	return result > mockScenario.now ? new Date(mockScenario.now) : result;
}

export function realisticActivityDate(from: Date, to: Date): Date {
	const safeTo = to > mockScenario.now ? mockScenario.now : to;
	for (let attempt = 0; attempt < 12; attempt++) {
		const day = randomDateBetween(startOfDay(from), endOfDay(safeTo));
		const weekday = day.getDay();
		const month = day.getMonth();
		const acceptance =
			weekday === 0 ? 0.35 : weekday === 6 ? 0.65 : month === 7 ? 0.58 : 1;
		if (faker.number.float({ min: 0, max: 1 }) <= acceptance) {
			return dateAtGymTime(day);
		}
	}
	return dateAtGymTime(addDays(startOfDay(from), 1));
}

export function chunksOf<T>(rows: readonly T[], size = MOCK_SCALE.batchSize): T[][] {
	const chunks: T[][] = [];
	for (let index = 0; index < rows.length; index += size) {
		chunks.push(rows.slice(index, index + size));
	}
	return chunks;
}
