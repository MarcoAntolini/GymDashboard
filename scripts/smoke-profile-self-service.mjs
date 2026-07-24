/**
 * Smoke checks for ticket 17 — Profilo self-service.
 * Run: node scripts/smoke-profile-self-service.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const profileDa = fs.readFileSync(path.join(root, "src/data-access/profile.ts"), "utf8");
assert.match(profileDa, /export async function getOwnProfile/);
assert.match(profileDa, /export async function updateOwnEmployeeProfile/);
assert.match(profileDa, /export async function updateOwnCredentials/);
assert.match(profileDa, /Non puoi modificare le credenziali di un altro Account/);
assert.match(profileDa, /La password attuale e' obbligatoria per cambiare la password/);
assert.match(profileDa, /input\.username != null && input\.username !== actor\.username/);
assert.match(profileDa, /bcrypt\.compare\(input\.currentPassword/);
assert.match(profileDa, /requireSession/);

const photoApi = fs.readFileSync(
	path.join(root, "src/app/api/profile/photo/route.ts"),
	"utf8"
);
assert.match(photoApi, /getOwnEmployeeIdForUpload/);
assert.match(photoApi, /profilesDir/);
assert.match(photoApi, /resolveProfilePhotoUrl/);
assert.match(photoApi, /writeFile/);

const photoLib = fs.readFileSync(path.join(root, "src/lib/profile-photo.ts"), "utf8");
assert.match(photoLib, /resolveProfilePhotoUrl/);
assert.match(photoLib, /public/);
assert.match(photoLib, /uploads/);
assert.match(photoLib, /profiles/);

const sheet = fs.readFileSync(
	path.join(root, "src/app/(dashboard)/_components/profile-sheet.tsx"),
	"utf8"
);
assert.match(sheet, /Profilo/);
assert.match(sheet, /updateOwnEmployeeProfile/);
assert.match(sheet, /updateOwnCredentials/);
assert.match(sheet, /\/api\/profile\/photo/);

const layout = fs.readFileSync(
	path.join(root, "src/app/(dashboard)/layout.tsx"),
	"utf8"
);
assert.match(layout, /ProfileSheet/);
assert.match(layout, /Profilo/);
assert.match(layout, /isProfileOpen/);

const gitkeep = path.join(root, "public/uploads/profiles/.gitkeep");
assert.equal(fs.existsSync(gitkeep), true);

console.log("smoke-profile-self-service: ok");
