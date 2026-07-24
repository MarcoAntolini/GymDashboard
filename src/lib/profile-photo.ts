import fs from "node:fs";
import path from "node:path";

export const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp"] as const;

export function profilesDir() {
	return path.join(process.cwd(), "public", "uploads", "profiles");
}

/** URL pubblica della foto se esiste su disco (storage locale). */
export function resolveProfilePhotoUrl(employeeId: number): string | null {
	const dir = profilesDir();
	for (const ext of PHOTO_EXTS) {
		const filePath = path.join(dir, `${employeeId}.${ext}`);
		if (fs.existsSync(filePath)) {
			return `/uploads/profiles/${employeeId}.${ext}`;
		}
	}
	return null;
}
