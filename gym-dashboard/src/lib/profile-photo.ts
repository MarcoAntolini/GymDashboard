import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profiles");
const PUBLIC_PREFIX = "/uploads/profiles";
const MAX_BYTES = 512 * 1024;
const EXT_BY_MIME: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
	const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
	if (!match) return null;
	const mime = match[1];
	const buffer = Buffer.from(match[2], "base64");
	if (!buffer.length || buffer.length > MAX_BYTES) return null;
	return { mime, buffer };
}

async function removeFileIfExists(publicUrl: string | null | undefined) {
	if (!publicUrl?.startsWith(`${PUBLIC_PREFIX}/`)) return;
	const filename = publicUrl.slice(PUBLIC_PREFIX.length + 1);
	if (!filename || filename.includes("..") || filename.includes("/")) return;
	try {
		await unlink(path.join(UPLOAD_DIR, filename));
	} catch {
		// Missing file is fine (already cleared / never written).
	}
}

/**
 * Persist optional profile photo for a Dipendente.
 * - `undefined` → leave unchanged (caller should not pass)
 * - `null` / `""` → clear stored photo
 * - existing `/uploads/profiles/…` → keep as-is
 * - `data:image/(jpeg|png|webp);base64,…` → write new file and return public URL
 */
export async function resolveProfilePhotoUrl(
	employeeId: number,
	incoming: string | null | undefined,
	current: string | null | undefined
): Promise<string | null | undefined> {
	if (incoming === undefined) return undefined;
	if (incoming === null || incoming === "") {
		await removeFileIfExists(current);
		return null;
	}
	if (incoming.startsWith(`${PUBLIC_PREFIX}/`)) {
		return incoming;
	}
	const parsed = parseDataUrl(incoming);
	if (!parsed) {
		throw new Error("Foto non valida. Usa JPEG, PNG o WebP entro 512 KB.");
	}
	const ext = EXT_BY_MIME[parsed.mime];
	if (!ext) {
		throw new Error("Formato foto non supportato.");
	}
	await mkdir(UPLOAD_DIR, { recursive: true });
	const filename = `${employeeId}-${Date.now()}.${ext}`;
	await writeFile(path.join(UPLOAD_DIR, filename), parsed.buffer);
	await removeFileIfExists(current);
	return `${PUBLIC_PREFIX}/${filename}`;
}
