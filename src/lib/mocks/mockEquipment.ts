import { Prisma, PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	italianEquipmentDescription,
	italianProvider,
} from "./italian";
import { MOCK_PAYMENT_TYPE } from "./prisma-enums";
import { chunksOf } from "./scenario";

function equipmentDescription(amount: number): string {
	if (amount >= 4_500) {
		return faker.helpers.arrayElement([
			"Tapis roulant professionale",
			"Ellittica crosstrainer",
			"Cavo crossover dual",
		]);
	}
	if (amount >= 1_800) {
		return faker.helpers.arrayElement([
			"Rack squat multiposizione",
			"Cavo crossover dual",
			"Set manubri gommato",
		]);
	}
	if (amount >= 700) {
		return faker.helpers.arrayElement([
			"Cyclette spin bike",
			"Panca piana olimpica",
			"Set manubri gommato",
		]);
	}

	const generated = italianEquipmentDescription();
	return ["Palla medica e kettlebell", "Panca piana olimpica"].includes(generated)
		? generated
		: "Palla medica e kettlebell";
}

function equipmentProvider(description: string): string {
	if (
		description.includes("Tapis") ||
		description.includes("Ellittica") ||
		description.includes("Cyclette")
	) {
		return faker.helpers.arrayElement([
			"Technogym Italia S.p.A.",
			"Life Fitness Italia",
		]);
	}
	if (
		description.includes("Rack") ||
		description.includes("Cavo") ||
		description.includes("Panca")
	) {
		return "Panatta Sport S.r.l.";
	}
	if (
		description.includes("manubri") ||
		description.includes("kettlebell")
	) {
		return "Lacertosus S.r.l.";
	}
	return italianProvider();
}

export async function mockEquipment(db: PrismaClient) {
	console.log("Mocking equipment...");
	const payments = await db.payment.findMany({
		where: { type: MOCK_PAYMENT_TYPE.Equipment },
		orderBy: { id: "asc" },
	});
	const equipment: Prisma.EquipmentCreateManyInput[] = payments.map(
		(payment) => {
			const description = equipmentDescription(payment.amount.toNumber());
			return {
				paymentId: payment.id,
				description,
				provider: equipmentProvider(description),
			};
		}
	);

	for (const batch of chunksOf(equipment)) {
		await db.equipment.createMany({ data: batch });
	}

	console.log(`Created ${equipment.length} mock equipment entries.`);
}
