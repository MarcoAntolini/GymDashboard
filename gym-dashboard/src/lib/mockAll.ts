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
import { mockPurchases } from "./mocks/mockPurchases";
import { mockSalaries } from "./mocks/mockSalaries";

export async function mockAllData() {
	console.log("Starting to mock all data...");

	// await clearAllData();

	const mockFunctions = [
		mockClients,
		mockProducts,
		mockMemberships,
		mockEntranceSets,
		mockCatalogs,
		mockPurchases,
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
	console.log("Clearing all existing data...");

	const tableOrder = [
		"ingressi",
		"acquisti",
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

	for (const tableName of tableOrder) {
		try {
			await db.$executeRawUnsafe(`SET foreign_key_checks = 0;`);
			await db.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
			await db.$executeRawUnsafe(`SET foreign_key_checks = 1;`);
			console.log(`Cleared table ${tableName}`);
		} catch (error) {
			console.log(`Error clearing table ${tableName}:`, error);
		}
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
