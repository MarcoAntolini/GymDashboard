"use server";

import { db } from "@/lib/db";
import { Entrance } from "@prisma/client";

export async function createEntrance({ clientId, date }: Omit<Entrance, "id">) {
	return await db.entrance.create({
		data: {
			clientId,
			date
		}
	});
}

export async function getAllEntrances() {
	return await db.entrance.findMany({
		include: {
			client: true
		}
	});
}

export async function getEntrance(clientId: number, date: Date) {
	return await db.entrance.findUnique({
		where: {
			clientId_date: {
				clientId,
				date
			}
		},
		include: {
			client: true
		}
	});
}

export async function editEntrance({ clientId, date }: Entrance) {
	return await db.entrance.update({
		where: {
			clientId_date: {
				clientId,
				date
			}
		},
		data: {
			date
		}
	});
}

export async function deleteEntrance({ clientId, date }: { clientId: number; date: Date }) {
	return await db.entrance.delete({
		where: {
			clientId_date: {
				clientId,
				date
			}
		}
	});
}

type DailyEntrances = {
	hourOfDay: string;
	totalEntrances: number;
};
type WeeklyEntrances = {
	dayOfWeek: string;
	totalEntrances: number;
};
type MonthlyEntrances = {
	month: string;
	totalEntrances: number;
};

export async function getDailyEntrances(startDate: Date, endDate: Date): Promise<DailyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate
			}
		}
	});
	const totalEntrances = new Array(24).fill(0);
	for (const entrance of entrances) {
		const hour = entrance.date.getHours();
		totalEntrances[hour] += entrance._count.date;
	}
	return Array.from({ length: 24 }, (_, hour) => ({
		hourOfDay: `${hour.toString().padStart(2, "0")}:00`,
		totalEntrances: totalEntrances[hour]
	}));
}

export async function getWeeklyEntrances(startDate: Date, endDate: Date): Promise<WeeklyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate
			}
		}
	});
	const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const weekdayCounts = new Array(7).fill(0);
	for (const entrance of entrances) {
		const day = entrance.date.getDay();
		weekdayCounts[day] += entrance._count.date;
	}
	return weekdays.map((day, index) => ({
		dayOfWeek: day,
		totalEntrances: weekdayCounts[index]
	}));
}

export async function getMonthlyEntrances(startDate: Date, endDate: Date): Promise<MonthlyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate
			}
		}
	});
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];
	const monthCounts = new Array(12).fill(0);
	for (const entrance of entrances) {
		const month = entrance.date.getMonth();
		monthCounts[month] += entrance._count.date;
	}
	return months.map((month, index) => ({
		month: month,
		totalEntrances: monthCounts[index]
	}));
}
