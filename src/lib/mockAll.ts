import { db } from "./db";
import { mockAccounts } from "./mocks/mockAccounts";
import { mockBills } from "./mocks/mockBills";
import { mockCatalogs } from "./mocks/mockCatalogs";
import { mockClients } from "./mocks/mockClients";
import { mockClockings } from "./mocks/mockClockings";
import { mockContracts } from "./mocks/mockContracts";
import { mockEmployees } from "./mocks/mockEmployees";
import { mockEntrances } from "./mocks/mockEntrances";
import { mockEntranceSets } from "./mocks/mockEntranceSets";
import { mockEquipment } from "./mocks/mockEquipment";
import { mockInterventions } from "./mocks/mockInterventions";
import { mockMemberships } from "./mocks/mockMemberships";
import { mockPayments } from "./mocks/mockPayments";
import { mockProducts } from "./mocks/mockProducts";
import { mockSales } from "./mocks/mockSales";
import { mockSalaries } from "./mocks/mockSalaries";
import { resetMockRandomness } from "./mocks/scenario";

export async function hasExistingData() {
	const [clients, employees, products, payments, sales, entrances] = await Promise.all([
		db.client.count(),
		db.employee.count(),
		db.product.count(),
		db.payment.count(),
		db.sale.count(),
		db.entrance.count(),
	]);
	return clients + employees + products + payments + sales + entrances > 0;
}

export async function mockAllData() {
	if (process.env.NODE_ENV !== "development") {
		throw new Error("mockAllData is development-only");
	}
	console.log("Starting to mock all data...");
	resetMockRandomness();

	await clearAllData();

	// Prodotti/specializzazioni/Listino → Clienti → Vendite → Ingressi (saleId reali).
	const mockFunctions = [
		mockProducts,
		mockMemberships,
		mockEntranceSets,
		mockCatalogs,
		mockClients,
		mockSales,
		mockEntrances,
		mockEmployees,
		mockContracts,
		mockClockings,
		mockPayments,
		mockSalaries,
		mockEquipment,
		mockBills,
		mockInterventions,
		mockAccounts,
	];

	for (const mockFunction of mockFunctions) {
		console.log(`Starting ${mockFunction.name}...`);
		await mockFunction(db);
		console.log(`Finished ${mockFunction.name}.`);
	}

	console.log("Finished mocking all data.");
}

async function clearAllData() {
	if (process.env.NODE_ENV !== "development") {
		throw new Error("clearAllData is development-only");
	}
	console.log("Clearing all existing data...");

	const tableOrder = [
		"ingressi",
		"vendite",
		"listini",
		"abbonamenti",
		"pacchetti_ingressi",
		"prodotti",
		"clienti",
		"timbrature",
		"stipendi",
		"attrezzature",
		"bollette",
		"interventi",
		"pagamenti",
		"contratti",
		"account",
		"dipendenti",
	];

	try {
		await db.$executeRawUnsafe(`SET foreign_key_checks = 0;`);
		for (const tableName of tableOrder) {
			await db.$executeRawUnsafe(`DELETE FROM \`${tableName}\`;`);
			console.log(`Cleared table ${tableName}`);
		}
	} finally {
		await db.$executeRawUnsafe(`SET foreign_key_checks = 1;`);
	}

	console.log("Finished clearing all existing data.");
}

if (require.main === module) {
	mockAllData()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Error mocking data:", error);
			process.exit(1);
		});
}
