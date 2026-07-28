import { PrismaClient } from "@prisma/client";
import {
	italianBillDescription,
	italianProvider,
} from "./italian";

export async function mockBills(db: PrismaClient) {
	console.log("Mocking bills...");
	const payments = await db.payment.findMany({ where: { type: "Bill" } });

	for (const payment of payments) {
		await db.bill.create({
			data: {
				paymentId: payment.id,
				description: italianBillDescription(),
				provider: italianProvider(),
			},
		});
	}

	console.log(`Created ${payments.length} mock bills.`);
}
