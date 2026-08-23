import { Prisma, PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	italianBillDescription,
	italianProvider,
} from "./italian";
import { MOCK_PAYMENT_TYPE } from "./prisma-enums";
import { chunksOf } from "./scenario";

function billDescription(amount: number, month: number): string {
	if (amount >= 5_500) return "Canone affitto locali";
	if (amount >= 2_200) {
		return month <= 2 || month >= 10
			? faker.helpers.arrayElement([
					"Fornitura gas naturale sede",
					"Bolletta energia elettrica palestra",
				])
			: "Bolletta energia elettrica palestra";
	}
	if (amount >= 800) {
		return faker.helpers.arrayElement([
			"Assicurazione RC struttura",
			"Fornitura gas naturale sede",
			"Bolletta energia elettrica palestra",
		]);
	}
	if (amount < 180) return "Connessione internet fibra";

	const generated = italianBillDescription();
	const plausibleDescriptions = [
		"Canone acqua e fognatura",
		"Servizio smaltimento rifiuti speciali",
		"Manutenzione caldaia annuale",
		"Fornitura gas naturale sede",
	];
	return plausibleDescriptions.includes(generated)
		? generated
		: faker.helpers.arrayElement(plausibleDescriptions);
}

function providerFor(description: string): string {
	if (description.includes("affitto")) return "Immobiliare Sportiva Lombarda S.r.l.";
	if (description.includes("energia")) return "Enel Energia";
	if (description.includes("gas")) return "Hera Comm";
	if (description.includes("acqua")) return "Gruppo CAP";
	if (description.includes("internet")) return "TIM Business";
	if (description.includes("Assicurazione")) return "UnipolSai Assicurazioni";
	if (description.includes("rifiuti")) return "A2A Ambiente";
	if (description.includes("caldaia")) return "Clima Service Milano";
	return italianProvider();
}

export async function mockBills(db: PrismaClient) {
	console.log("Mocking bills...");
	const payments = await db.payment.findMany({
		where: { type: MOCK_PAYMENT_TYPE.Bill },
		orderBy: { id: "asc" },
	});
	const bills: Prisma.BillCreateManyInput[] = payments.map((payment) => {
		const description = billDescription(
			payment.amount.toNumber(),
			payment.date.getMonth()
		);
		return {
			paymentId: payment.id,
			description,
			provider: providerFor(description),
		};
	});

	for (const batch of chunksOf(bills)) {
		await db.bill.createMany({ data: batch });
	}

	console.log(`Created ${bills.length} mock bills.`);
}
