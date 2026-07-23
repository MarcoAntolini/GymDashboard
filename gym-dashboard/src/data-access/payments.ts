"use server";

import { db } from "@/lib/db";
import { paymentTypeLabel } from "@/lib/format";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Payment, PaymentType, Prisma } from "@prisma/client";

type PaymentData = {
	date: Date;
	amount: number;
	type: PaymentType;
} & (
	| { type: "Salary"; employeeId: number }
	| { type: "Bill"; description: string; provider: string }
	| { type: "Equipment"; description: string; provider: string }
	| {
			type: "Intervention";
			description: string;
			maker: string;
			startingTime: Date;
			endingTime: Date;
	  }
);

const paymentInclude = {
	intervention: true,
	equipment: true,
	bill: true,
	salary: {
		include: {
			employee: true,
		},
	},
} as const;

export type PaymentDTO = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

const labelToPaymentType = Object.fromEntries(
	(Object.keys(paymentTypeLabel) as PaymentType[]).map((type) => [
		paymentTypeLabel[type],
		type,
	])
) as Record<string, PaymentType>;

function resolvePaymentTypes(values: string[]): PaymentType[] {
	const types: PaymentType[] = [];
	for (const value of values) {
		if ((Object.values(PaymentType) as string[]).includes(value)) {
			types.push(value as PaymentType);
			continue;
		}
		const mapped = labelToPaymentType[value];
		if (mapped) types.push(mapped);
	}
	return types;
}

/**
 * `detail` search is decomposed across specialization fields — never on a
 * client-concatenated display string.
 */
function detailWhere(value: string): Prisma.PaymentWhereInput {
	const or: Prisma.PaymentWhereInput[] = [
		{ bill: { is: { provider: { contains: value } } } },
		{ bill: { is: { description: { contains: value } } } },
		{ equipment: { is: { provider: { contains: value } } } },
		{ equipment: { is: { description: { contains: value } } } },
		{ intervention: { is: { maker: { contains: value } } } },
		{ intervention: { is: { description: { contains: value } } } },
		{ salary: { is: { employee: { name: { contains: value } } } } },
		{ salary: { is: { employee: { surname: { contains: value } } } } },
	];

	const asId = Number(value.replace(/^#/, "").trim());
	if (Number.isInteger(asId) && asId > 0) {
		or.push({ salary: { is: { employeeId: asId } } });
	}

	return { OR: or };
}

const paymentFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.PaymentWhereInput | undefined>
> = {
	detail: (filter) => {
		const value = textContains(filter);
		return value ? detailWhere(value) : undefined;
	},
	typeLabel: (filter) => {
		const values = enumValues(filter);
		if (!values) return undefined;
		const types = resolvePaymentTypes(values);
		return types.length > 0 ? { type: { in: types } } : undefined;
	},
	type: (filter) => {
		const values = enumValues(filter);
		if (!values) return undefined;
		const types = resolvePaymentTypes(values);
		return types.length > 0 ? { type: { in: types } } : undefined;
	},
};

const paymentSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.PaymentOrderByWithRelationInput>
> = {
	date: (desc) => ({ date: desc ? "desc" : "asc" }),
	amount: (desc) => ({ amount: desc ? "desc" : "asc" }),
	id: (desc) => ({ id: desc ? "desc" : "asc" }),
	type: (desc) => ({ type: desc ? "desc" : "asc" }),
	typeLabel: (desc) => ({ type: desc ? "desc" : "asc" }),
};

async function loadPaymentFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const where = buildWhere(filters, paymentFilterMap, { exclude: "typeLabel" });
	const groups = await db.payment.groupBy({
		by: ["type"],
		where,
		_count: { _all: true },
		orderBy: { type: "asc" },
	});

	return {
		typeLabel: groups.map((group) => ({
			value: paymentTypeLabel[group.type],
			count: group._count._all,
		})),
	};
}

export async function createPayment(data: PaymentData) {
	const { date, amount, type, ...specificData } = data;
	const payment = await db.payment.create({
		data: {
			date,
			amount,
			type,
		},
	});
	switch (type) {
		case "Salary":
			await db.salary.create({
				data: {
					paymentId: payment.id,
					employeeId: (specificData as { employeeId: number }).employeeId,
				},
			});
			break;
		case "Bill":
			await db.bill.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					provider: (specificData as { provider: string }).provider,
				},
			});
			break;
		case "Equipment":
			await db.equipment.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					provider: (specificData as { provider: string }).provider,
				},
			});
			break;
		case "Intervention":
			await db.intervention.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					maker: (specificData as { maker: string }).maker,
					startingTime: (specificData as { startingTime: Date }).startingTime,
					endingTime: (specificData as { endingTime: Date }).endingTime,
				},
			});
			break;
	}

	return db.payment.findUniqueOrThrow({
		where: { id: payment.id },
		include: paymentInclude,
	});
}

/** Server-paginated/filtered payment list (detail search on specialization fields). */
export async function listPayments(rawQuery: ListQuery): Promise<ListResult<PaymentDTO>> {
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, paymentFilterMap);
	const orderBy = resolveOrderBy(query.sort, paymentSortMap, { date: "desc" });

	const [total, items, facets] = await Promise.all([
		db.payment.count({ where }),
		db.payment.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: paymentInclude,
		}),
		loadPaymentFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getPayment(id: number) {
	return await db.payment.findUnique({
		where: {
			id,
		},
		include: paymentInclude,
	});
}

export async function editPayment({ id, date, amount, type }: Payment) {
	return await db.payment.update({
		where: {
			id,
		},
		data: {
			date,
			amount,
			type,
		},
		include: paymentInclude,
	});
}

export async function deletePayment({ id }: { id: number }) {
	return await db.payment.delete({
		where: {
			id,
		},
		include: paymentInclude,
	});
}
