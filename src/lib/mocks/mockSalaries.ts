import { Prisma, PrismaClient } from "@prisma/client";
import { MOCK_PAYMENT_TYPE } from "./prisma-enums";
import { chunksOf } from "./scenario";

type EmployeeWithContracts = Prisma.EmployeeGetPayload<{
	include: { contracts: true };
}>;

type SalaryPayment = Prisma.PaymentGetPayload<Record<string, never>>;

function monthKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth()}`;
}

function activeContract(employee: EmployeeWithContracts, date: Date) {
	if (employee.hiringDate > date) return undefined;
	return employee.contracts.find(
		(contract) =>
			contract.startingDate <= date &&
			(contract.endingDate === null || contract.endingDate > date)
	);
}

function expectedSalary(employee: EmployeeWithContracts, date: Date): number {
	const hourlyFee = activeContract(employee, date)?.hourlyFee.toNumber() ?? 15;
	const thirteenthMonthFactor = date.getMonth() === 11 ? 1.3 : 1;
	return Math.min(
		4_900,
		Math.max(1_150, hourlyFee * 146 * thirteenthMonthFactor)
	);
}

function matchMonthlySalaries(
	payments: SalaryPayment[],
	employees: EmployeeWithContracts[]
): Prisma.SalaryCreateManyInput[] {
	const candidates = payments.map((payment) =>
		employees
			.filter((employee) => activeContract(employee, payment.date))
			.sort(
				(left, right) =>
					Math.abs(
						expectedSalary(left, payment.date) - payment.amount.toNumber()
					) -
					Math.abs(
						expectedSalary(right, payment.date) - payment.amount.toNumber()
					)
			)
	);
	const paymentOrder = payments
		.map((_, index) => index)
		.sort((left, right) => candidates[left].length - candidates[right].length);
	const employeeAssignments = new Map<number, number>();

	function assign(paymentIndex: number, visited: Set<number>): boolean {
		for (const employee of candidates[paymentIndex]) {
			if (visited.has(employee.id)) continue;
			visited.add(employee.id);
			const previousPayment = employeeAssignments.get(employee.id);
			if (
				previousPayment === undefined ||
				assign(previousPayment, visited)
			) {
				employeeAssignments.set(employee.id, paymentIndex);
				return true;
			}
		}
		return false;
	}

	for (const paymentIndex of paymentOrder) {
		if (!assign(paymentIndex, new Set())) {
			throw new Error(
				`Nessun dipendente attivo disponibile per lo stipendio ${payments[paymentIndex].id}.`
			);
		}
	}

	const employeeByPayment = new Map<number, number>();
	for (const [employeeId, paymentIndex] of employeeAssignments) {
		employeeByPayment.set(paymentIndex, employeeId);
	}
	return payments.map((payment, index) => ({
		paymentId: payment.id,
		employeeId: employeeByPayment.get(index)!,
	}));
}

export async function mockSalaries(db: PrismaClient) {
	console.log("Mocking salaries...");
	const [employees, payments] = await Promise.all([
		db.employee.findMany({
			include: { contracts: { orderBy: { startingDate: "asc" } } },
			orderBy: { id: "asc" },
		}),
		db.payment.findMany({
			where: { type: MOCK_PAYMENT_TYPE.Salary },
			orderBy: [{ date: "asc" }, { id: "asc" }],
		}),
	]);
	const paymentsByMonth = new Map<string, SalaryPayment[]>();
	for (const payment of payments) {
		const key = monthKey(payment.date);
		const monthlyPayments = paymentsByMonth.get(key) ?? [];
		monthlyPayments.push(payment);
		paymentsByMonth.set(key, monthlyPayments);
	}

	const salaries = Array.from(paymentsByMonth.values()).flatMap(
		(monthlyPayments) => matchMonthlySalaries(monthlyPayments, employees)
	);
	for (const batch of chunksOf(salaries)) {
		await db.salary.createMany({ data: batch });
	}

	console.log(`Created ${salaries.length} mock salaries.`);
}