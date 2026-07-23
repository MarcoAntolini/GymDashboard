import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

declare global {
	var prisma: PrismaClient | undefined;
}

function parseDatabaseUrl(url: string) {
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : 3306,
		user: decodeURIComponent(parsed.username),
		password: decodeURIComponent(parsed.password),
		database: parsed.pathname.replace(/^\//, ""),
	};
}

function createPrismaClient() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is required");
	}
	const adapter = new PrismaMariaDb(parseDatabaseUrl(url));
	return new PrismaClient({ adapter });
}

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalThis.prisma = db;
}
