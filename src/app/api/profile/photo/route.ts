import { getOwnEmployeeIdForUpload } from "@/data-access/profile";
import { UNAUTHENTICATED_MESSAGE } from "@/lib/auth";
import {
	PHOTO_EXTS,
	profilesDir,
	resolveProfilePhotoUrl,
} from "@/lib/profile-photo";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIME_TO_EXT: Record<string, (typeof PHOTO_EXTS)[number]> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function POST(req: NextRequest) {
	try {
		const employeeId = await getOwnEmployeeIdForUpload();
		const form = await req.formData();
		const file = form.get("photo");
		if (!(file instanceof File)) {
			return NextResponse.json(
				{ success: false, message: "File foto mancante" },
				{ status: 400 }
			);
		}
		if (file.size <= 0 || file.size > MAX_BYTES) {
			return NextResponse.json(
				{ success: false, message: "Foto troppo grande (max 2 MB)" },
				{ status: 400 }
			);
		}
		const ext = MIME_TO_EXT[file.type];
		if (!ext) {
			return NextResponse.json(
				{ success: false, message: "Formato non supportato (jpg, png, webp)" },
				{ status: 400 }
			);
		}

		const dir = profilesDir();
		await fs.mkdir(dir, { recursive: true });

		for (const oldExt of PHOTO_EXTS) {
			const oldPath = path.join(dir, `${employeeId}.${oldExt}`);
			try {
				await fs.unlink(oldPath);
			} catch {
				/* ignore missing */
			}
		}

		const dest = path.join(dir, `${employeeId}.${ext}`);
		const buffer = Buffer.from(await file.arrayBuffer());
		await fs.writeFile(dest, buffer);

		const photoUrl = resolveProfilePhotoUrl(employeeId);
		return NextResponse.json(
			{ success: true, photoUrl, message: "Foto aggiornata" },
			{ status: 200 }
		);
	} catch (error) {
		const message =
			error instanceof Error && error.message
				? error.message
				: "Upload fallito";
		const status = message === UNAUTHENTICATED_MESSAGE ? 401 : 400;
		return NextResponse.json({ success: false, message }, { status });
	}
}
