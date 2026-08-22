import { PaymentType, PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	italianInterventionDescription,
	italianProvider,
} from "./italian";

export async function mockInterventions(db: PrismaClient) {
	console.log("Mocking interventions...");
	const payments = await db.payment.findMany({
		where: { type: PaymentType.Intervention },
	});

	for (const payment of payments) {
		const startingTime = faker.date.recent({ days: 90 });
		const endingTime = faker.date.between({
			from: startingTime,
			to: new Date(),
		});

		await db.intervention.create({
			data: {
				paymentId: payment.id,
				description: italianInterventionDescription(),
				maker: italianProvider(),
				startingTime,
				endingTime,
			},
		});
	}

	console.log(`Created ${payments.length} mock interventions.`);
}
