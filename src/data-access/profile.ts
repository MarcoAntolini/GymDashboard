"use server";

import { AuthError, requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import {
	PROFILE_OWNERSHIP_ERROR,
	assertOwnAccount,
	assertPasswordChangeAllowed,
} from "@/lib/domain/profile-ownership";
import {
	PROFILE_PHOTO_DIR,
	assertProfilePhotoSize,
	extFromMime,
	profilePhotoCandidateFilenames,
	profilePhotoPublicPath,
	profilePhotoRelativeFsPath,
	type ProfilePhotoExt,
} from "@/lib/domain/profile-photo";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
	createSessionValue,
	getSessionCookieName,
	getSessionTtlSeconds,
	signSessionValue,
} from "@/lib/session";
import { isAppRole } from "@/data/nav-routes";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

export type OwnProfile = {
	username: string;
	role: string;
	employee: {
		id: number;
		taxCode: string;
		name: string;
		surname: string;
		birthDate: Date;
		street: string;
		houseNumber: string;
		city: string;
		province: string;
		phoneNumber: string;
		email: string;
		hiringDate: Date;
	};
	photoUrl: string | null;
};

async function resolvePhotoUrl(employeeId: number): Promise<string | null> {
	const dir = path.join(process.cwd(), "public", PROFILE_PHOTO_DIR);
	for (const filename of profilePhotoCandidateFilenames(employeeId)) {
		try {
			await fs.access(path.join(dir, filename));
			const ext = filename.split(".").pop() as ProfilePhotoExt;
			return profilePhotoPublicPath(employeeId, ext);
		} catch {
			/* try next */
		}
	}
	return null;
}

/** Load the session user's Account + linked Dipendente + photo URL. */
export async function getOwnProfile(): Promise<OwnProfile> {
	const session = await requireRole("Employee");
	const account = await db.account.findUnique({
		where: { username: session.u },
		include: { employee: true },
	});
	if (!account?.employee) {
		throw new AuthError("Profilo non trovato", 404);
	}
	const photoUrl = await resolvePhotoUrl(account.employee.id);
	return {
		username: account.username,
		role: account.role,
		employee: {
			id: account.employee.id,
			taxCode: account.employee.taxCode,
			name: account.employee.name,
			surname: account.employee.surname,
			birthDate: account.employee.birthDate,
			street: account.employee.street,
			houseNumber: account.employee.houseNumber,
			city: account.employee.city,
			province: account.employee.province,
			phoneNumber: account.employee.phoneNumber,
			email: account.employee.email,
			hiringDate: account.employee.hiringDate,
		},
		photoUrl,
	};
}

/**
 * Self-service anagrafica update on the Dipendente linked to the session Account.
 * Rejects foreign employeeId (ownership).
 */
export async function updateOwnEmployee(input: {
	id: number;
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	hiringDate: Date;
}) {
	const session = await requireRole("Employee");
	const account = await db.account.findUnique({
		where: { username: session.u },
		select: { employeeId: true, username: true },
	});
	if (!account) {
		throw new AuthError("Account non trovato", 404);
	}
	assertOwnAccount(session.u, account.username);
	if (input.id !== account.employeeId) {
		throw new AuthError(PROFILE_OWNERSHIP_ERROR, 403);
	}

	assertAllowedMutation("dipendenti", "update", input);
	const {
		id,
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;

	return await db.employee.update({
		where: { id },
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			hiringDate,
		},
	});
}

/**
 * Change own username. `targetUsername` must equal the session user (rejects others).
 * Username is Account PK → delete+recreate in a transaction; session cookie is refreshed.
 */
export async function changeOwnUsername(input: {
	targetUsername: string;
	newUsername: string;
}) {
	const session = await requireRole("Employee");
	try {
		assertOwnAccount(session.u, input.targetUsername);
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : PROFILE_OWNERSHIP_ERROR, 403);
	}

	const newUsername = input.newUsername.trim();
	if (newUsername.length < 4 || newUsername.length > 12) {
		throw new AuthError("Username deve essere tra 4 e 12 caratteri", 400);
	}
	if (newUsername === session.u) {
		return { username: session.u };
	}

	const existing = await db.account.findUnique({ where: { username: newUsername } });
	if (existing) {
		throw new AuthError("Username già in uso", 409);
	}

	const current = await db.account.findUnique({ where: { username: session.u } });
	if (!current) {
		throw new AuthError("Account non trovato", 404);
	}

	await db.$transaction(async (tx) => {
		await tx.account.delete({ where: { username: session.u } });
		await tx.account.create({
			data: {
				username: newUsername,
				password: current.password,
				role: current.role,
				approved: current.approved,
				employeeId: current.employeeId,
			},
		});
	});

	if (!isAppRole(current.role)) {
		throw new AuthError("Ruolo non valido", 500);
	}

	const now = Math.floor(Date.now() / 1000);
	const { payloadB64, payload } = createSessionValue(newUsername, current.role, now);
	const value = await signSessionValue(payloadB64);
	(await cookies()).set(getSessionCookieName(), value, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: getSessionTtlSeconds(),
		expires: new Date(payload.exp * 1000),
	});

	return { username: newUsername };
}

/**
 * Change own password. Requires current password. Rejects foreign `targetUsername`.
 */
export async function changeOwnPassword(input: {
	targetUsername: string;
	currentPassword: string;
	newPassword: string;
}) {
	const session = await requireRole("Employee");
	try {
		assertOwnAccount(session.u, input.targetUsername);
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : PROFILE_OWNERSHIP_ERROR, 403);
	}

	const account = await db.account.findUnique({ where: { username: session.u } });
	if (!account) {
		throw new AuthError("Account non trovato", 404);
	}

	const matches = await verifyPassword(input.currentPassword, account.password);
	try {
		assertPasswordChangeAllowed({
			currentPasswordProvided: Boolean(input.currentPassword),
			currentPasswordMatches: matches,
		});
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "Password non valida", 400);
	}

	if (
		!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(input.newPassword)
	) {
		throw new AuthError(
			"Nuova password: min 8 caratteri, una maiuscola, una minuscola e un numero",
			400
		);
	}

	const hashed = await hashPassword(input.newPassword);
	await db.account.update({
		where: { username: session.u },
		data: { password: hashed },
	});

	return { ok: true as const };
}

/**
 * Upload/replace profile photo for the session user's Dipendente (local public/uploads).
 */
export async function uploadOwnPhoto(formData: FormData) {
	const session = await requireRole("Employee");
	const account = await db.account.findUnique({
		where: { username: session.u },
		select: { employeeId: true, username: true },
	});
	if (!account) {
		throw new AuthError("Account non trovato", 404);
	}
	assertOwnAccount(session.u, account.username);

	const file = formData.get("photo");
	if (!(file instanceof File)) {
		throw new AuthError("File foto mancante", 400);
	}

	const mime = file.type || "";
	const ext = extFromMime(mime);
	if (!ext) {
		throw new AuthError("Formato non supportato (jpg, png, webp)", 400);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	try {
		assertProfilePhotoSize(buffer.byteLength);
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "File non valido", 400);
	}

	const dir = path.join(process.cwd(), "public", PROFILE_PHOTO_DIR);
	await fs.mkdir(dir, { recursive: true });

	// Remove previous photo variants for this employee
	for (const filename of profilePhotoCandidateFilenames(account.employeeId)) {
		try {
			await fs.unlink(path.join(dir, filename));
		} catch {
			/* absent */
		}
	}

	const relative = profilePhotoRelativeFsPath(account.employeeId, ext);
	await fs.writeFile(path.join(process.cwd(), "public", relative), buffer);

	return { photoUrl: profilePhotoPublicPath(account.employeeId, ext) };
}
