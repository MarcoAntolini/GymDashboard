import { Prisma, PrismaClient } from "@prisma/client";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { faker } from "./faker";
import { MOCK_PAYMENT_TYPE } from "./prisma-enums";
import { chunksOf, mockScenario } from "./scenario";

const TARGET_PAYMENT_COUNT = 1_750;

type EmployeeWithContracts = Prisma.EmployeeGetPayload<{
	include: { contracts: true };
}>;

function laterDate(left: Date, right: Date): Date {
	return left > right ? left : right;
}

function earlierDate(left: Date, right: Date): Date {
	return left < right ? left : right;
}

function atNoon(date: Date): Date {
	const result = new Date(date);
	result.setHours(12, 0, 0, 0);
	return result;
}

function decimalAmount(min: number, max: number): Prisma.Decimal {
	return new Prisma.Decimal(
		faker.number.float({ min, max, fractionDigits: 2 })
	);
}

function randomDateInMonth(month: Date): Date {
	const from = laterDate(startOfMonth(month), mockScenario.openedAt);
	const to = earlierDate(endOfMonth(month), mockScenario.now);
	const candidate = atNoon(faker.date.between({ from, to }));
	return earlierDate(laterDate(candidate, from), to);
}

function contractAt(employee: EmployeeWithContracts, date: Date) {
	return employee.contracts.find(
		(contract) =>
			contract.startingDate <= date &&
			(contract.endingDate === null || contract.endingDate > date)
	);
}

function salaryDateInMonth(
	employee: EmployeeWithContracts,
	month: Date
): Date | null {
	const monthFrom = laterDate(startOfMonth(month), mockScenario.openedAt);
	const monthTo = earlierDate(endOfMonth(month), mockScenario.now);
	const preferredDate = new Date(month);
	preferredDate.setDate(27);
	preferredDate.setHours(12, 0, 0, 0);

	for (const contract of employee.contracts) {
		const activeFrom = laterDate(
			laterDate(monthFrom, employee.hiringDate),
			contract.startingDate
		);
		const contractLastInstant =
			contract.endingDate === null
				? monthTo
				: new Date(contract.endingDate.getTime() - 1);
		const activeTo = earlierDate(monthTo, contractLastInstant);
		if (activeFrom > activeTo) continue;

		return earlierDate(laterDate(preferredDate, activeFrom), activeTo);
	}

	return null;
}

function salaryAmount(
	employee: EmployeeWithContracts,
	date: Date
): Prisma.Decimal {
	const hourlyFee = contractAt(employee, date)?.hourlyFee.toNumber() ?? 15;
	const hours = faker.number.int({ min: 124, max: 168 });
	const thirteenthMonthFactor = date.getMonth() === 11 ? 1.3 : 1;
	const grossSalary = hourlyFee * hours * thirteenthMonthFactor;
	return new Prisma.Decimal(
		Math.min(4_900, Math.max(1_150, grossSalary)).toFixed(2)
	);
}

function billAmount(month: Date, slot: number): Prisma.Decimal {
	const season = month.getMonth();
	switch (slot % 8) {
		case 0:
			return decimalAmount(6_500, 9_000); // affitto
		case 1:
			return decimalAmount(
				season >= 5 && season <= 8 ? 2_500 : 1_400,
				season >= 5 && season <= 8 ? 4_800 : 3_100
			); // energia
		case 2:
			return decimalAmount(
				season <= 2 || season >= 10 ? 1_200 : 180,
				season <= 2 || season >= 10 ? 3_600 : 650
			); // gas
		case 3:
			return decimalAmount(250, 750); // acqua
		case 4:
			return decimalAmount(75, 165); // connettività
		case 5:
			return decimalAmount(650, 1_800); // assicurazione
		case 6:
			return decimalAmount(180, 580); // rifiuti
		default:
			return decimalAmount(190, 720); // manutenzione impianti
	}
}

function equipmentAmount(): Prisma.Decimal {
	return decimalAmount(280, 9_500);
}

function interventionAmount(): Prisma.Decimal {
	return decimalAmount(90, 1_900);
}

export async function mockPayments(db: PrismaClient) {
	console.log("Mocking payments...");
	const employees = await db.employee.findMany({
		include: { contracts: { orderBy: { startingDate: "asc" } } },
		orderBy: { id: "asc" },
	});
	const months: Date[] = [];
	for (
		let month = startOfMonth(mockScenario.openedAt);
		month <= startOfMonth(mockScenario.now);
		month = addMonths(month, 1)
	) {
		months.push(month);
	}

	const payments: Prisma.PaymentCreateManyInput[] = [];
	for (const month of months) {
		for (const employee of employees) {
			const date = salaryDateInMonth(employee, month);
			if (date === null) continue;
			payments.push({
				date,
				amount: salaryAmount(employee, date),
				type: MOCK_PAYMENT_TYPE.Salary,
			});
		}

		for (let slot = 0; slot < 8; slot++) {
			payments.push({
				date: randomDateInMonth(month),
				amount: billAmount(month, slot),
				type: MOCK_PAYMENT_TYPE.Bill,
			});
		}
		payments.push({
			date: randomDateInMonth(month),
			amount: equipmentAmount(),
			type: MOCK_PAYMENT_TYPE.Equipment,
		});
		payments.push({
			date: randomDateInMonth(month),
			amount: interventionAmount(),
			type: MOCK_PAYMENT_TYPE.Intervention,
		});
	}

	const extraTypes = [
		MOCK_PAYMENT_TYPE.Intervention,
		MOCK_PAYMENT_TYPE.Bill,
		MOCK_PAYMENT_TYPE.Equipment,
		MOCK_PAYMENT_TYPE.Intervention,
		MOCK_PAYMENT_TYPE.Bill,
	] as const;
	for (
		let extraIndex = 0;
		payments.length < TARGET_PAYMENT_COUNT;
		extraIndex++
	) {
		const month = months[extraIndex % months.length];
		const type = extraTypes[extraIndex % extraTypes.length];
		payments.push({
			date: randomDateInMonth(month),
			amount:
				type === MOCK_PAYMENT_TYPE.Bill
					? billAmount(month, extraIndex)
					: type === MOCK_PAYMENT_TYPE.Equipment
						? equipmentAmount()
						: interventionAmount(),
			type,
		});
	}

	for (const batch of chunksOf(payments)) {
		// Prisma 7 does not currently translate mapped enum values in createMany.
		await db.$transaction(
			batch.map((data) => db.payment.create({ data }))
		);
	}

	console.log(`Created ${payments.length} mock payments.`);
}