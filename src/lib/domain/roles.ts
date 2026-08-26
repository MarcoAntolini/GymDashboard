import { isAppRole, type AppRole } from "@/data/nav-routes";
import { Role } from "@prisma/client";

/**
 * Prisma 7.2: `@map` fa sì che `Role.Owner === "Proprietario"` (valore DB / letture),
 * ma il query compiler accetta solo i nomi schema (`Owner`) in where/data.
 */
const APP_TO_PRISMA = {
	Owner: "Owner" as Role,
	Admin: "Admin" as Role,
	Employee: "Employee" as Role,
} as const;

const PRISMA_TO_APP = {
	[Role.Owner]: "Owner",
	[Role.Admin]: "Admin",
	[Role.Employee]: "Employee",
} as const satisfies Record<Role, AppRole>;

export function toPrismaRole(role: AppRole): Role {
	return APP_TO_PRISMA[role];
}

/** Accetta sia AppRole (sessione/UI) sia Role Prisma (DB). */
export function toAppRole(value: unknown): AppRole | undefined {
	if (isAppRole(value)) return value;
	if (value === Role.Owner || value === Role.Admin || value === Role.Employee) {
		return PRISMA_TO_APP[value];
	}
	return undefined;
}
