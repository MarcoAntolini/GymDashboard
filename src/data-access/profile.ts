"use server";

import { isAppRole, roleAllows } from "@/data/nav-routes";
import {
	FORBIDDEN_MESSAGE,
	UNAUTHENTICATED_MESSAGE,
	requireSession,
} from "@/lib/auth";
import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo";
import {
	createSessionValue,
	getSessionCookieName,
	getSessionTtlSeconds,
	signSessionValue,
} from "@/lib/session";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SALT_ROUNDS = 10;

const CREDENTIALS_OTHER_ACCOUNT_MESSAGE =
	"Non puoi modificare le credenziali di un altro Account";
const CURRENT_PASSWORD_REQUIRED_MESSAGE =
	"La password attuale e' obbligatoria per cambiare la password";
const CURRENT_PASSWORD_INVALID_MESSAGE = "Password attuale non corretta";
const IDENTITY_SELF_EDIT_MESSAGE =
	"Solo Amministratore o Proprietario possono modificare nome, cognome, codice fiscale e data di nascita";

async function loadOwnApprovedAccount(username: string) {
	const account = await db.account.findUnique({
		where: { username },
		include: { employee: true },
	});
	if (!account?.approved || !isAppRole(account.role) || !account.employee) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	return account;
}

/** Profilo dell'Account in sessione (Dipendente collegato + credenziali senza password). */
export async function getOwnProfile() {
	const actor = await requireSession();
	const account = await loadOwnApprovedAccount(actor.username);
	const employee = account.employee!;
	const canEditIdentity = roleAllows(account.role, "Admin");
	return {
		username: account.username,
		role: account.role,
		canEditIdentity,
		employee: {
			id: employee.id,
			taxCode: employee.taxCode,
			name: employee.name,
			surname: employee.surname,
			birthDate: employee.birthDate,
			street: employee.street,
			houseNumber: employee.houseNumber,
			city: employee.city,
			province: employee.province,
			phoneNumber: employee.phoneNumber,
			email: employee.email,
		},
		photoUrl: resolveProfilePhotoUrl(employee.id),
	};
}

/**
 * Aggiorna il solo Dipendente collegato all'Account corrente.
 * - Dipendente: solo recapiti (indirizzo, telefono, email).
 * - Admin/Owner: anche identità (nome, cognome, CF, data di nascita).
 */
export async function updateOwnEmployeeProfile(input: {
	taxCode?: string;
	name?: string;
	surname?: string;
	birthDate?: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
}) {
	const actor = await requireSession();
	const account = await loadOwnApprovedAccount(actor.username);
	const employeeId = account.employeeId;
	const canEditIdentity = roleAllows(account.role, "Admin");

	const contacts = {
		id: employeeId,
		street: input.street,
		houseNumber: input.houseNumber,
		city: input.city,
		province: input.province,
		phoneNumber: input.phoneNumber,
		email: input.email,
	};

	if (!canEditIdentity) {
		const identityTouched =
			input.taxCode != null ||
			input.name != null ||
			input.surname != null ||
			input.birthDate != null;
		if (identityTouched) {
			const current = account.employee!;
			const changed =
				(input.taxCode != null && input.taxCode !== current.taxCode) ||
				(input.name != null && input.name !== current.name) ||
				(input.surname != null && input.surname !== current.surname) ||
				(input.birthDate != null &&
					input.birthDate.getTime() !== current.birthDate.getTime());
			if (changed) {
				throw new Error(IDENTITY_SELF_EDIT_MESSAGE);
			}
		}
		assertMutationPayload("employee", "update", contacts);
		return await db.employee.update({
			where: { id: employeeId },
			data: {
				street: input.street,
				houseNumber: input.houseNumber,
				city: input.city,
				province: input.province,
				phoneNumber: input.phoneNumber,
				email: input.email,
			},
		});
	}

	if (
		input.taxCode == null ||
		input.name == null ||
		input.surname == null ||
		input.birthDate == null
	) {
		throw new Error(FORBIDDEN_MESSAGE);
	}

	const payload = {
		...contacts,
		taxCode: input.taxCode,
		name: input.name,
		surname: input.surname,
		birthDate: input.birthDate,
	};
	assertMutationPayload("employee", "update", payload);
	return await db.employee.update({
		where: { id: employeeId },
		data: {
			taxCode: input.taxCode,
			name: input.name,
			surname: input.surname,
			birthDate: input.birthDate,
			street: input.street,
			houseNumber: input.houseNumber,
			city: input.city,
			province: input.province,
			phoneNumber: input.phoneNumber,
			email: input.email,
		},
	});
}

/**
 * Cambio username/password self-service.
 * - Sempre sull'Account in sessione; `username` (se passato) deve coincidere.
 * - Cambio password richiede `currentPassword` e la verifica sul hash.
 */
export async function updateOwnCredentials(input: {
	/** Se presente e diverso dalla sessione → reject (AC: niente credenziali altrui). */
	username?: string;
	currentPassword?: string;
	newUsername?: string;
	newPassword?: string;
}) {
	const actor = await requireSession();
	if (input.username != null && input.username !== actor.username) {
		throw new Error(CREDENTIALS_OTHER_ACCOUNT_MESSAGE);
	}

	const newUsername = input.newUsername?.trim();
	const newPassword = input.newPassword;
	if (!newUsername && !newPassword) {
		throw new Error("Nessuna modifica alle credenziali");
	}

	const account = await loadOwnApprovedAccount(actor.username);

	if (newPassword) {
		if (!input.currentPassword) {
			throw new Error(CURRENT_PASSWORD_REQUIRED_MESSAGE);
		}
		const ok = await bcrypt.compare(input.currentPassword, account.password);
		if (!ok) {
			throw new Error(CURRENT_PASSWORD_INVALID_MESSAGE);
		}
		if (newPassword.length < 4) {
			throw new Error("La nuova password deve avere almeno 4 caratteri");
		}
	}

	if (newUsername && newUsername !== account.username) {
		if (newUsername.length < 4 || newUsername.length > 12) {
			throw new Error("Username deve essere tra 4 e 12 caratteri");
		}
		const taken = await db.account.findUnique({
			where: { username: newUsername },
			select: { username: true },
		});
		if (taken) {
			throw new Error("Username gia' in uso");
		}
	}

	const data: { username?: string; password?: string } = {};
	if (newUsername && newUsername !== account.username) {
		data.username = newUsername;
	}
	if (newPassword) {
		data.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
	}

	const updated = await db.account.update({
		where: { username: account.username },
		data,
	});

	const sessionUsername = updated.username;
	if (sessionUsername !== actor.username) {
		const now = Math.floor(Date.now() / 1000);
		const { payloadB64, payload } = createSessionValue(
			sessionUsername,
			account.role,
			now
		);
		const value = await signSessionValue(payloadB64);
		(await cookies()).set(getSessionCookieName(), value, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: getSessionTtlSeconds(),
			expires: new Date(payload.exp * 1000),
		});
	}

	return { username: updated.username };
}

/** Usato dall'API upload: employeeId dell'Account in sessione. */
export async function getOwnEmployeeIdForUpload() {
	const actor = await requireSession();
	const account = await loadOwnApprovedAccount(actor.username);
	return account.employeeId;
}
