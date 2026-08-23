import type { ContractType, PaymentType, Role } from "@prisma/client";

/**
 * Prisma 7.2 generates mapped database labels as enum values, while its
 * runtime validator still expects the schema member names. Keep the
 * development seed on the runtime-safe values until Prisma fixes the mismatch.
 */
export const MOCK_CONTRACT_TYPE = {
	FixedTerm: "FixedTerm" as ContractType,
	OpenEnded: "OpenEnded" as ContractType,
} as const;

export const MOCK_PAYMENT_TYPE = {
	Salary: "Salary" as PaymentType,
	Bill: "Bill" as PaymentType,
	Equipment: "Equipment" as PaymentType,
	Intervention: "Intervention" as PaymentType,
} as const;

export const MOCK_ROLE = {
	Owner: "Owner" as Role,
	Admin: "Admin" as Role,
	Employee: "Employee" as Role,
} as const;
