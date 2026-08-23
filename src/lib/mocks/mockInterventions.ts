import { Prisma, PrismaClient } from "@prisma/client";
import { subDays, subHours } from "date-fns";
import { faker } from "./faker";
import {
	italianInterventionDescription,
	italianProvider,
} from "./italian";
import { MOCK_PAYMENT_TYPE } from "./prisma-enums";
import { chunksOf, mockScenario } from "./scenario";

function interventionDescription(amount: number): string {
	if (amount >= 1_200) {
		return faker.helpers.arrayElement([
			"Riparazione climatizzatore sala pesi",
			"Controllo impianto elettrico spogliatoi",
			"Sostituzione cinghia tapis roulant",
		]);
	}
	if (amount >= 450) {
		return faker.helpers.arrayElement([
			"Manutenzione ordinaria attrezzi cardio",
			"Sostituzione cuscinetti cyclette",
			"Allineamento guida cavi pulley",
			"Taratura bilance e macchinari",
		]);
	}
	return italianInterventionDescription();
}

function makerFor(description: string): string {
	if (description.includes("climatizzatore") || description.includes("filtri")) {
		return "Clima Service Milano";
	}
	if (description.includes("elettrico")) return "ElettroService Nord S.r.l.";
	if (
		description.includes("tapis") ||
		description.includes("cardio") ||
		description.includes("cyclette")
	) {
		return faker.helpers.arrayElement([
			"Technogym Service Italia",
			"Life Fitness Italia",
		]);
	}
	if (
		description.includes("cavi") ||
		description.includes("bilance") ||
		description.includes("macchinari")
	) {
		return "Panatta Sport Service";
	}
	return italianProvider();
}

function interventionTimes(paymentDate: Date) {
	const earliestEnding =
		subDays(paymentDate, 3) > mockScenario.openedAt
			? subDays(paymentDate, 3)
			: mockScenario.openedAt;
	const endingTime = faker.date.between({
		from: earliestEnding,
		to: paymentDate,
	});
	const proposedStart = subHours(
		endingTime,
		faker.number.int({ min: 1, max: 14 })
	);
	const startingTime =
		proposedStart > mockScenario.openedAt
			? proposedStart
			: mockScenario.openedAt;
	return { startingTime, endingTime };
}

export async function mockInterventions(db: PrismaClient) {
	console.log("Mocking interventions...");
	const payments = await db.payment.findMany({
		where: { type: MOCK_PAYMENT_TYPE.Intervention },
		orderBy: { id: "asc" },
	});
	const interventions: Prisma.InterventionCreateManyInput[] = payments.map(
		(payment) => {
			const description = interventionDescription(payment.amount.toNumber());
			const { startingTime, endingTime } = interventionTimes(payment.date);
			return {
				paymentId: payment.id,
				description,
				maker: makerFor(description),
				startingTime,
				endingTime,
			};
		}
	);

	for (const batch of chunksOf(interventions)) {
		await db.intervention.createMany({ data: batch });
	}

	console.log(`Created ${interventions.length} mock interventions.`);
}
