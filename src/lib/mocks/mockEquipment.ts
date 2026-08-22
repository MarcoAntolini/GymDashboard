import { PaymentType, PrismaClient } from "@prisma/client";
import {
	italianEquipmentDescription,
	italianProvider,
} from "./italian";

export async function mockEquipment(db: PrismaClient) {
	console.log("Mocking equipment...");
	const payments = await db.payment.findMany({ where: { type: PaymentType.Equipment } });

	for (const payment of payments) {
		await db.equipment.create({
			data: {
				paymentId: payment.id,
				description: italianEquipmentDescription(),
				provider: italianProvider(),
			},
		});
	}

	console.log(`Created ${payments.length} mock equipment entries.`);
}
