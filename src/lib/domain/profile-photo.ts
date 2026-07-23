/**
 * Local profile photo paths (ticket 17).
 * Files live under public/uploads/profiles/{employeeId}.{ext}
 */

export const PROFILE_PHOTO_DIR = "uploads/profiles";

export const PROFILE_PHOTO_ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"] as const;

export type ProfilePhotoExt = (typeof PROFILE_PHOTO_ALLOWED_EXT)[number];

export const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

const MIME_TO_EXT: Record<string, ProfilePhotoExt> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export function extFromMime(mime: string): ProfilePhotoExt | null {
	return MIME_TO_EXT[mime.toLowerCase()] ?? null;
}

export function isAllowedProfilePhotoMime(mime: string): boolean {
	return extFromMime(mime) !== null;
}

export function assertProfilePhotoSize(byteLength: number): void {
	if (byteLength <= 0) {
		throw new Error("File foto vuoto");
	}
	if (byteLength > PROFILE_PHOTO_MAX_BYTES) {
		throw new Error("Foto troppo grande (max 2 MB)");
	}
}

/** Relative public URL path (no leading slash required by callers). */
export function profilePhotoPublicPath(employeeId: number, ext: ProfilePhotoExt): string {
	return `/${PROFILE_PHOTO_DIR}/${employeeId}.${ext}`;
}

/** Relative filesystem path under project `public/`. */
export function profilePhotoRelativeFsPath(employeeId: number, ext: ProfilePhotoExt): string {
	return `${PROFILE_PHOTO_DIR}/${employeeId}.${ext}`;
}

/** Candidate filenames for an employee (any allowed ext). */
export function profilePhotoCandidateFilenames(employeeId: number): string[] {
	return PROFILE_PHOTO_ALLOWED_EXT.map((ext) => `${employeeId}.${ext}`);
}
