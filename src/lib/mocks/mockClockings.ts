import { Prisma, PrismaClient } from "@prisma/client";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { faker } from "./faker";
import {
	chunksOf,
	mockScenario,
	realisticActivityDate,
} from "./scenario";

export async function mockClockings(db: PrismaClient) {
	console.log("Mocking clockings...");
	const contracts = await db.contract.findMany({
		select: {
			employeeId: true,
			startingDate: true,
			endingDate: true,
		},
	});
	const historicalEnd = endOfDay(subDays(mockScenario.today, 1));
	const windows = contracts
		.map((contract) => {
			const to =
				contract.endingDate && contract.endingDate < historicalEnd
					? contract.endingDate
					: historicalEnd;
			const durationDays = Math.floor(
				(to.getTime() - contract.startingDate.getTime()) / 86_400_000
			);
			return { ...contract, to, weight: Math.max(1, durationDays) };
		})
		.filter((window) => window.startingDate <= window.to);

	if (windows.length === 0) {
		console.log("No contract periods found; skipping clockings.");
		return;
	}

	const totalWeight = windows.reduce((sum, window) => sum + window.weight, 0);
	const pickWindow = () => {
		let cursor = faker.number.int({ min: 1, max: totalWeight });
		for (const window of windows) {
			cursor -= window.weight;
			if (cursor <= 0) return window;
		}
		return windows[windows.length - 1];
	};
	const historicalCount = faker.number.int({ min: 23_000, max: 26_000 });
	const rows: Prisma.ClockingCreateManyInput[] = [];
	const uniqueEntrances = new Set<string>();

	while (rows.length < historicalCount) {
		const window = pickWindow();
		const activityDate = realisticActivityDate(window.startingDate, window.to);
		const shift = faker.helpers.weightedArrayElement([
			{ value: { minHour: 5, maxHour: 7, partTimeChance: 20 }, weight: 36 },
			{ value: { minHour: 7, maxHour: 10, partTimeChance: 25 }, weight: 39 },
			{ value: { minHour: 12, maxHour: 14, partTimeChance: 45 }, weight: 25 },
		]);
		const entranceTime = startOfDay(activityDate);
		entranceTime.setHours(
			faker.number.int({ min: shift.minHour, max: shift.maxHour }),
			faker.number.int({ min: 0, max: 59 }),
			faker.number.int({ min: 0, max: 59 }),
			0
		);
		const isPartTime =
			faker.number.int({ min: 1, max: 100 }) <= shift.partTimeChance;
		const durationMinutes = isPartTime
			? faker.number.int({ min: 240, max: 360 })
			: faker.number.int({ min: 420, max: 540 });
		const exitTime = new Date(
			entranceTime.getTime() + durationMinutes * 60_000
		);

		if (
			entranceTime < window.startingDate ||
			entranceTime > window.to ||
			exitTime > window.to
		) {
			continue;
		}

		const key = `${window.employeeId}:${entranceTime.toISOString()}`;
		if (uniqueEntrances.has(key)) continue;
		uniqueEntrances.add(key);
		rows.push({
			employeeId: window.employeeId,
			entranceTime,
			exitTime,
		});
	}

	const activeContracts = contracts.filter(
		(contract) => contract.endingDate === null
	);
	if (activeContracts.length > 0) {
		const contract = faker.helpers.arrayElement(activeContracts);
		const earliestToday = startOfDay(mockScenario.today).getTime();
		const entranceTime = new Date(
			Math.max(
				earliestToday,
				mockScenario.now.getTime() -
					faker.number.int({ min: 30, max: 180 }) * 60_000
			)
		);
		rows.push({
			employeeId: contract.employeeId,
			entranceTime,
			exitTime: null,
		});
	}

	for (const batch of chunksOf(rows)) {
		await db.clocking.createMany({ data: batch });
	}

	console.log(
		`Created ${rows.length} mock clockings (${historicalCount} completed, ${rows.length - historicalCount} open today).`
	);
}