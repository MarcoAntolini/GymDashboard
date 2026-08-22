import { isAppRole, type AppRole } from "@/data/nav-routes";
import { Role } from "@prisma/client";

/** Prisma 7: `@map` fa sì che `Role.Employee === "Dipendente"` (valore DB). */
const APP_TO_PRISMA = {
	Owner: Role.Owner,
	Admin: Role.Admin,
	Employee: Role.Employee,
} as const satisfies Record<AppRole, Role>;

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
