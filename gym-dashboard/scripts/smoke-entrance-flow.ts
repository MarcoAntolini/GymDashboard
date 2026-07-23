import { Prisma, PrismaClient } from "@prisma/client";
import { selectJustifyingPurchaseId } from "../src/lib/entrance-justification";

const NO_JUSTIFYING_PURCHASE_ERROR =
	"Nessun Acquisto giustifica questo Ingresso: nessun Abbonamento valido in data e nessun Pacchetto con residuo > 0.";

const db = new PrismaClient();

const entranceInclude = {
	purchase: {
		include: {
			client: true,
			prodotto: {
				include: {
					membership: true,
					entranceSet: true
				}
			}
		}
	}
} as const;

function serializeEntrance<T extends { purchase: { amount: Prisma.Decimal } }>(entrance: T) {
	return {
		...entrance,
		purchase: {
			...entrance.purchase,
			amount: Number(entrance.purchase.amount)
		}
	};
}

async function registerEntrance(clientId: number, date?: Date) {
	const entranceDate = date ?? new Date();

	const entrance = await db.$transaction(
		async (tx) => {
			await tx.$queryRaw`
				SELECT id FROM acquisti WHERE id_cliente = ${clientId} FOR UPDATE
			`;

			const purchases = await tx.purchase.findMany({
				where: { clientId },
				include: {
					_count: {
						select: { entrances: true }
					}
				}
			});

			const purchaseId = selectJustifyingPurchaseId(
				purchases.map((p) => ({
					id: p.id,
					date: p.date,
					membershipDuration: p.membershipDuration,
					entranceNumber: p.entranceNumber,
					usedEntrances: p._count.entrances
				})),
				entranceDate
			);

			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.create({
				data: {
					purchaseId,
					date: entranceDate
				},
				include: entranceInclude
			});
		},
		{
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
		}
	);

	return serializeEntrance(entrance);
}

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function expectReject(label: string, fn: () => Promise<unknown>, includes: string) {
	try {
		await fn();
		throw new Error(`${label}: expected rejection, but succeeded`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		assert(message.includes(includes), `${label}: unexpected error: ${message}`);
		console.log(`OK  ${label}`);
	}
}

async function main() {
	const stamp = Date.now();
	const productCode = `SMOKE-PKG-${stamp}`;
	const year = new Date().getFullYear();

	console.log("smoke-entrance-flow: setup…");

	await db.product.create({ data: { code: productCode } });
	await db.entranceSet.create({
		data: { productCode, entranceNumber: 1 }
	});
	await db.catalog.create({
		data: {
			year,
			productCode,
			price: new Prisma.Decimal("25.00")
		}
	});

	const client = await db.client.create({
		data: {
			name: "Smoke",
			surname: "Test",
			email: `smoke-${stamp}@example.com`,
			phoneNumber: "0000000000",
			birthDate: new Date("1990-01-01"),
			taxCode: `SMOKE${stamp}`.slice(0, 16),
			street: "Via Smoke",
			houseNumber: "1",
			city: "Test",
			province: "TS"
		}
	});

	const purchase = await db.purchase.create({
		data: {
			clientId: client.id,
			date: new Date(),
			amount: new Prisma.Decimal("25.00"),
			productCode,
			membershipDuration: null,
			entranceNumber: 1
		}
	});

	// Live Product N changed after sale must not revive residual on sold Acquisto.
	await db.entranceSet.update({
		where: { productCode },
		data: { entranceNumber: 99 }
	});

	const entrance = await registerEntrance(client.id);
	assert(entrance.purchaseId === purchase.id, "first Ingresso must attach to smoke Acquisto");
	assert(
		typeof entrance.purchase.amount === "number",
		"Entrance.purchase.amount must be a number for Client Components"
	);
	console.log("OK  Acquisto → Ingresso (residuo 1 → 0)");

	await expectReject(
		"second Ingresso on exhausted Pacchetto",
		() => registerEntrance(client.id),
		"Nessun Acquisto giustifica"
	);

	await expectReject(
		"delete Acquisto with Ingressi",
		async () => {
			try {
				await db.purchase.delete({ where: { id: purchase.id } });
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					(error.code === "P2003" || error.code === "P2014")
				) {
					throw new Error(
						"Cannot delete this Acquisto because it has linked Ingressi. Remove the Ingressi first."
					);
				}
				throw error;
			}
		},
		"linked Ingressi"
	);

	await expectReject(
		"delete Prodotto with Acquisti",
		async () => {
			try {
				await db.product.delete({ where: { code: productCode } });
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					(error.code === "P2003" || error.code === "P2014")
				) {
					throw new Error(
						"Cannot delete this Prodotto because it has linked Acquisti. Remove the Acquisti first."
					);
				}
				throw error;
			}
		},
		"linked Acquisti"
	);

	await expectReject(
		"delete Cliente with Acquisti",
		async () => {
			try {
				await db.client.delete({ where: { id: client.id } });
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					(error.code === "P2003" || error.code === "P2014")
				) {
					throw new Error(
						"Cannot delete this Cliente because they have linked Acquisti. Remove the Acquisti first."
					);
				}
				throw error;
			}
		},
		"linked Acquisti"
	);

	await db.entrance.delete({ where: { id: entrance.id } });
	await db.purchase.delete({ where: { id: purchase.id } });
	await db.catalog.delete({
		where: { year_productCode: { year, productCode } }
	});
	await db.entranceSet.delete({ where: { productCode } });
	await db.product.delete({ where: { code: productCode } });
	await db.client.delete({ where: { id: client.id } });

	console.log("smoke-entrance-flow: all checks passed");
}

main()
	.catch((error) => {
		console.error("smoke-entrance-flow FAILED:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
