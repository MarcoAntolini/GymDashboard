import { Prisma, PrismaClient } from "@prisma/client";
import {
	addDays,
	differenceInCalendarDays,
	endOfDay,
	startOfDay,
	subDays,
} from "date-fns";
import { faker } from "./faker";
import { MOCK_CONTRACT_TYPE } from "./prisma-enums";
import {
	MOCK_SCALE,
	chunksOf,
	mockScenario,
	randomDateBetween,
} from "./scenario";

export async function mockContracts(db: PrismaClient) {
	console.log("Mocking contracts...");
	const employees = await db.employee.findMany({ orderBy: { id: "asc" } });
	const activeEmployeeCount = Math.min(
		employees.length,
		Math.round(MOCK_SCALE.employees * 0.83)
	);
	const rows: Prisma.ContractCreateManyInput[] = [];

	for (const [employeeIndex, employee] of employees.entries()) {
		const isActive = employeeIndex < activeEmployeeCount;
		const requestedContractCount = faker.helpers.weightedArrayElement([
			{ value: 1, weight: 42 },
			{ value: 2, weight: 40 },
			{ value: 3, weight: 18 },
		]);
		const employmentEnd = isActive
			? mockScenario.today
			: randomDateBetween(
					addDays(startOfDay(employee.hiringDate), 240),
					subDays(mockScenario.today, 90)
				);
		const employmentDays = Math.max(
			1,
			differenceInCalendarDays(employmentEnd, employee.hiringDate)
		);
		const maxContracts = employmentDays >= 180 ? 3 : employmentDays >= 90 ? 2 : 1;
		const contractCount = Math.min(requestedContractCount, maxContracts);
		const baseHourlyFee = faker.number.float({
			min: 11.5,
			max: 22.5,
			fractionDigits: 2,
		});
		let startingDate = startOfDay(employee.hiringDate);

		for (let contractIndex = 0; contractIndex < contractCount; contractIndex++) {
			const isLastContract = contractIndex === contractCount - 1;
			let endingDate: Date | null = null;

			if (!isLastContract) {
				const boundaryDays = Math.floor(
					(employmentDays * (contractIndex + 1)) / contractCount
				);
				endingDate = endOfDay(
					addDays(startOfDay(employee.hiringDate), boundaryDays)
				);
			} else if (!isActive) {
				endingDate = endOfDay(employmentEnd);
			}

			rows.push({
				employeeId: employee.id,
				type:
					isLastContract && isActive
						? MOCK_CONTRACT_TYPE.OpenEnded
						: MOCK_CONTRACT_TYPE.FixedTerm,
				hourlyFee: new Prisma.Decimal(
					(baseHourlyFee * (1 + contractIndex * 0.025)).toFixed(2)
				),
				startingDate,
				endingDate,
			});

			if (endingDate) {
				startingDate = startOfDay(
					addDays(endingDate, faker.number.int({ min: 3, max: 18 }))
				);
			}
		}
	}

	for (const batch of chunksOf(rows)) {
		// Prisma 7 does not currently translate mapped enum values in createMany.
		await db.$transaction(
			batch.map((data) => db.contract.create({ data }))
		);
	}

	console.log(
		`Created ${rows.length} mock contracts for ${activeEmployeeCount} active and ${employees.length - activeEmployeeCount} former employees.`
	);
}
