import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

declare global {
	var prismaDb: PrismaClient | undefined;
}

function mariadbConfigFromDatabaseUrl(databaseUrl: string) {
	const parsed = new URL(databaseUrl);
	const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
	return {
		host: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : 3306,
		user: decodeURIComponent(parsed.username),
		password: decodeURIComponent(parsed.password),
		database: database || undefined,
	};
}

function createPrismaClient() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is not set");
	}

	return new PrismaClient({
		adapter: new PrismaMariaDb(mariadbConfigFromDatabaseUrl(url)),
	});
}

export const db = globalThis.prismaDb || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalThis.prismaDb = db;
}
