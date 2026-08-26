import { ContractType } from "@prisma/client";

/**
 * Prisma 7.2: `@map` fa sì che `ContractType.FixedTerm === "Tempo determinato"`
 * (valore DB / letture), ma il query compiler accetta solo i nomi schema
 * (`FixedTerm`) in where/data. Il bundle browser espone invece i nomi schema
 * come valori — il faceted filter UI invia quindi `FixedTerm`.
 */
export type AppContractType = "FixedTerm" | "OpenEnded";

export const APP_CONTRACT_TYPE_LABEL: Record<AppContractType, string> = {
	FixedTerm: "Tempo determinato",
	OpenEnded: "Tempo indeterminato",
};

const APP_TO_PRISMA = {
	FixedTerm: "FixedTerm" as ContractType,
	OpenEnded: "OpenEnded" as ContractType,
} as const;

const PRISMA_TO_APP = {
	[ContractType.FixedTerm]: "FixedTerm",
	[ContractType.OpenEnded]: "OpenEnded",
} as const satisfies Record<ContractType, AppContractType>;

export function isAppContractType(value: unknown): value is AppContractType {
	return value === "FixedTerm" || value === "OpenEnded";
}

export function toPrismaContractType(type: AppContractType): ContractType {
	return APP_TO_PRISMA[type];
}

/** Accetta nomi schema (UI/browser) e valori Prisma mappati (DB). */
export function toAppContractType(value: unknown): AppContractType | undefined {
	if (isAppContractType(value)) return value;
	if (value === ContractType.FixedTerm || value === ContractType.OpenEnded) {
		return PRISMA_TO_APP[value];
	}
	return undefined;
}
